import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { GlassButton, GlassInput, Shell } from "@/components/glass";
import { storeProviderToken } from "@/utils/googleCalendar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicDesk — Never miss a deadline again" },
      {
        name: "description",
        content:
          "CivicDesk tracks your warranties, subscriptions and document deadlines, and tells you exactly what to do before time runs out.",
      },
      { property: "og:title", content: "CivicDesk — Never miss a deadline again" },
      {
        property: "og:description",
        content:
          "Capture a receipt, get a deadline, sync it to your calendar. Your personal life-admin assistant.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        storeProviderToken(data.session.provider_token);
        navigate({ to: "/home", replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox to confirm your email, then sign in.");
          setTab("signin");
        } else {
          navigate({ to: "/home", replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { access_type: "offline", prompt: "consent" },
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    storeProviderToken(data.session?.provider_token);
    navigate({ to: "/home", replace: true });
  }

  return (
    <Shell>
      <main className="safe-top flex min-h-[100dvh] flex-col justify-center px-6 pb-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">CivicDesk</h1>
          <p className="mt-2 text-sm text-white/60">
            Your life admin, captured, scheduled and handled.
          </p>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="mb-5 flex rounded-2xl bg-white/[0.06] p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`press min-h-11 flex-1 rounded-xl text-sm font-semibold ${
                  tab === t ? "bg-white/15 text-white" : "text-white/55"
                }`}
              >
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "signup" ? (
              <GlassInput
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Doe"
                autoComplete="name"
              />
            ) : null}
            <GlassInput
              label="Email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
            <GlassInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
            />
            <GlassButton type="submit" loading={loading} className="w-full">
              {tab === "signin" ? "Sign in" : "Create account"}
            </GlassButton>
          </form>

          <div className="my-4 flex items-center gap-3 text-[11px] text-white/40">
            <span className="h-px flex-1 bg-white/15" />
            OR
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <GlassButton variant="glass" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </GlassButton>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/35">
          CivicDesk Beta by Stratustal
        </p>
      </main>
    </Shell>
  );
}
