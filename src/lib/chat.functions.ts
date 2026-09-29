import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { openRouterChat } from "./openrouter";

const Input = z.object({ message: z.string().trim().min(1).max(1200) });

type AppContext = { items: unknown[]; deadlines: unknown[]; documents: unknown[] };

function assistantSystem(context: AppContext) {
  return `You are CivicDesk Assistant. Answer only from the user's CivicDesk data supplied below. Do not claim to browse the internet, inspect hidden files, access other users, or know anything not in this data. Documents contain AI-extracted metadata only; you cannot read a file's original contents unless it is included below. If the answer is missing, uncertain, or needs an unsupported action, say exactly: "Sorry, I don't have enough information to do that." Be concise and protect privacy.\n\nUSER DATA:\n${JSON.stringify(context)}`;
}

export const askCivicDeskAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    // The middleware client carries the caller's JWT, so Supabase RLS limits every
    // query to that caller's items, deadlines, and document metadata.
    const db = context.supabase;
    const [items, deadlines, documents] = await Promise.all([
      db
        .from("items")
        .select("id,title,category,brand,summary,purchase_date,created_at")
        .limit(100),
      db
        .from("deadlines")
        .select("id,item_id,title,deadline_date,recommended_action,status")
        .limit(100),
      db.from("documents").select("item_id,extracted_data,created_at").limit(100),
    ]);
    if (items.error || deadlines.error || documents.error)
      throw new Error("Your CivicDesk data could not be read.");

    const response = await openRouterChat({
      messages: [
        {
          role: "system",
          content: assistantSystem({
            items: items.data ?? [],
            deadlines: deadlines.data ?? [],
            documents: documents.data ?? [],
          }),
        },
        { role: "user", content: data.message },
      ],
      temperature: 0.2,
      max_tokens: 700,
    });
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return {
      message:
        json.choices?.[0]?.message?.content?.trim() ||
        "Sorry, I don't have enough information to do that.",
    };
  });
