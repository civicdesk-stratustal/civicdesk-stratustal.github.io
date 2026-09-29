import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { askCivicDeskAssistant } from "@/lib/chat.functions";
import { GlassButton, GlassCard } from "@/components/glass";

export const Route = createFileRoute("/_authenticated/assistant")({ component: AssistantPage });
type Message = { role: "user" | "assistant"; text: string };
function AssistantPage() {
  const ask = useServerFn(askCivicDeskAssistant);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Ask me about the subscriptions, documents, warranties, gift cards, and deadlines saved in your CivicDesk.",
    },
  ]);
  async function submit() {
    const question = text.trim();
    if (!question || busy) return;
    setText("");
    setBusy(true);
    setMessages((current) => [...current, { role: "user", text: question }]);
    try {
      const result = await ask({ data: { message: question } });
      setMessages((current) => [...current, { role: "assistant", text: result.message }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "Sorry, I don't have enough information to do that." },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="safe-top flex min-h-[calc(100dvh-7rem)] flex-col px-5">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" /> Assistant
        </h1>
        <p className="mt-1 text-xs text-foreground/55">
          It can use only the CivicDesk data in your account.
        </p>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((message, index) => (
          <GlassCard
            key={index}
            className={message.role === "user" ? "ml-8 bg-primary/15" : "mr-4"}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.text}
            </p>
          </GlassCard>
        ))}
        {busy ? (
          <p className="px-2 text-xs text-foreground/50">Looking through your CivicDesk…</p>
        ) : null}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="safe-bottom flex gap-2 pb-2"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask about your saved items"
          className="glass min-h-12 flex-1 rounded-2xl px-4 text-sm outline-none"
          maxLength={1200}
        />
        <GlassButton
          type="submit"
          aria-label="Send"
          disabled={busy || !text.trim()}
          className="min-h-12 px-4"
        >
          <Send className="h-4 w-4" />
        </GlassButton>
      </form>
    </div>
  );
}
