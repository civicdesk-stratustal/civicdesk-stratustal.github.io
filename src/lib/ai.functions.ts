import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY_LIST = ["Documents", "Warranties", "Subscriptions", "Gift Cards", "Return Windows"];

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

const SYSTEM = `You read personal life-admin documents (receipts, warranties, invoices, subscription confirmations, gift cards, ID documents).
Reply with STRICT JSON only, no markdown fences, using exactly this shape:
{"category":"one of: ${CATEGORY_LIST.join(", ")}","title":"short item name","summary":"one or two sentence summary","deadline_date":"YYYY-MM-DD or null","recommended_action":"short practical action"}
Rules: category MUST be exactly one of the listed values. deadline_date is the date the user must act by (warranty expiry, return window close, renewal date, document expiry); use null when the document has no deadline. Never invent facts that are not in the document.`;

function extractJson(text: string): DocumentAnalysis | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<DocumentAnalysis>;
    return {
      category: CATEGORY_LIST.includes(String(parsed.category)) ? String(parsed.category) : "Documents",
      title: String(parsed.title ?? "").slice(0, 120),
      summary: String(parsed.summary ?? "").slice(0, 600),
      deadline_date:
        typeof parsed.deadline_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.deadline_date)
          ? parsed.deadline_date
          : null,
      recommended_action: String(parsed.recommended_action ?? "").slice(0, 300),
    };
  } catch {
    return null;
  }
}

export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DocumentAnalysis> => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error("Document reading is not configured yet.");

    const today = new Date().toISOString().slice(0, 10);
    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `Today is ${today}. Read the attached document(s) and return the JSON object.`,
      },
      ...data.files.map((f) => ({ type: "image_url", image_url: { url: f.dataUrl } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many documents at once. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits have run out. Add credits to keep reading documents.");
    if (!res.ok) {
      const body = await res.text();
      console.error("AI gateway error", res.status, body);
      throw new Error("The document could not be read automatically.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(text);
    if (!parsed || !parsed.title) throw new Error("The document could not be read automatically.");
    return parsed;
  });
