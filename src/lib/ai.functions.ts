import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerEnv } from "./server-env";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY_LIST = [
  "Documents",
  "Warranties",
  "Subscriptions",
  "Gift Cards",
  "Return Windows",
];

const MODEL = "google/gemma-4-26b-a4b-it";

const InputSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string(),
        mimeType: z.string(),
        dataUrl: z.string().min(16),
      }),
    )
    .min(1)
    .max(5),
});

export type DocumentAnalysis = {
  category: string;
  title: string;
  summary: string;
  deadline_date: string | null;
  recommended_action: string;
};

const SYSTEM = `You read personal life-admin documents such as receipts, warranties, invoices, subscription confirmations, gift cards, identity documents, and other important documents.

Reply with STRICT JSON only, with exactly this shape:
{
  "category": "one of: ${CATEGORY_LIST.join(", ")}",
  "title": "short item name",
  "summary": "one or two sentence summary",
  "deadline_date": "YYYY-MM-DD or null",
  "recommended_action": "short practical action"
}

Rules:
- category MUST be exactly one of the listed values.
- deadline_date is the date the user must act by, such as a warranty expiry, return-window close, renewal date, payment deadline, or document expiry.
- Use null when there is no clear deadline.
- Never invent facts that are not present in the document.
- If a date is ambiguous, use null rather than guessing.
- Keep the title concise.
- Keep the summary factual and useful.
- Keep recommended_action practical and concise.
- Return JSON only. No markdown fences.
`;

function extractJson(text: string): DocumentAnalysis | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      cleaned.slice(start, end + 1),
    ) as Partial<DocumentAnalysis>;

    return {
      category: CATEGORY_LIST.includes(String(parsed.category))
        ? String(parsed.category)
        : "Documents",

      title: String(parsed.title ?? "").slice(0, 120),

      summary: String(parsed.summary ?? "").slice(0, 600),

      deadline_date:
        typeof parsed.deadline_date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsed.deadline_date)
          ? parsed.deadline_date
          : null,

      recommended_action: String(
        parsed.recommended_action ?? "",
      ).slice(0, 300),
    };
  } catch {
    return null;
  }
}

type OpenRouterContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    }
  | {
      type: "file";
      file: {
        filename: string;
        file_data: string;
      };
    };

function createDocumentContent(
  files: Array<{
    name: string;
    mimeType: string;
    dataUrl: string;
  }>,
  today: string,
): OpenRouterContentPart[] {
  const content: OpenRouterContentPart[] = [
    {
      type: "text",
      text: `Today is ${today}. Read the attached document(s) and return the required JSON object.`,
    },
  ];

  for (const file of files) {
    if (file.mimeType === "application/pdf") {
      content.push({
        type: "file",
        file: {
          filename: file.name,
          file_data: file.dataUrl,
        },
      });
      continue;
    }

    if (file.mimeType.startsWith("image/")) {
      content.push({
        type: "image_url",
        image_url: {
          url: file.dataUrl,
        },
      });
      continue;
    }

    throw new Error(
      `Unsupported document format: ${file.mimeType || "unknown"}. Please upload an image or PDF.`,
    );
  }

  return content;
}

export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DocumentAnalysis> => {
    const apiKey = getServerEnv("OPENROUTER_API_KEY");

    if (!apiKey) {
      throw new Error("Document reading is not configured yet.");
    }

    const today = new Date().toISOString().slice(0, 10);

    const content = createDocumentContent(data.files, today);

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            getServerEnv("APP_URL") ??
            "https://civicdesk.stratustal.workers.dev",
          "X-Title": "CivicDesk",
        },
        body: JSON.stringify({
          model: MODEL,

          messages: [
            {
              role: "system",
              content: SYSTEM,
            },
            {
              role: "user",
              content,
            },
          ],

          temperature: 0.1,
          max_tokens: 800,

          response_format: {
            type: "json_object",
          },

          // Prefer providers that do not collect prompts for training.
          // OpenRouter applies this at the provider-routing layer.
          provider: {
            data_collection: "deny",
          },
        }),
      },
    );

    if (res.status === 401) {
      throw new Error("The document AI service is not configured correctly.");
    }

    if (res.status === 402) {
      throw new Error(
        "The document AI service has insufficient credits.",
      );
    }

    if (res.status === 429) {
      throw new Error(
        "Too many documents at once. Try again in a moment.",
      );
    }

    if (!res.ok) {
      const body = await res.text();

      console.error("OpenRouter error", {
        status: res.status,
        body,
      });

      throw new Error(
        "The document could not be read automatically.",
      );
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const text = json.choices?.[0]?.message?.content ?? "";

    const parsed = extractJson(text);

    if (!parsed || !parsed.title) {
      console.error("OpenRouter returned invalid document analysis", {
        text,
      });

      throw new Error(
        "The document could not be read automatically.",
      );
    }

    return parsed;
  });
