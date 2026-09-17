import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
          "CivicDesk reads your receipts, warranties and documents, sets the deadline for you and tells you exactly what to do before time runs out.",
      },
      { property: "og:title", content: "CivicDesk — Never miss a deadline again" },
      {
        property: "og:description",
        content:
          "Scan a document, get a deadline, sync it to your calendar. Your personal life-admin assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (!signIn.error) {
        navigate({ to: "/home", replace: true });
        return;
      }

      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: email.split("@")[0] },
        },
      });
      if (signUp.error) {
        toast.error(signUp.error.message);
        return;
      }
      if (signUp.data.session) {
        navigate({ to: "/home", replace: true });
        return;
      }

      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) {
        toast.success("Check your inbox to confirm your email, then sign in.");
        return;
      }
      navigate({ to: "/home", replace: true });
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">CivicDesk</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Your life admin, captured, scheduled and handled.
          </p>
        </div>

        <div className="glass rounded-3xl p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
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
              autoComplete="current-password"
            />
            <GlassButton type="submit" loading={loading} className="w-full">
              Continue
            </GlassButton>
            <p className="text-center text-xs text-foreground/50">
              New here? Your account is created automatically.
            </p>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-foreground/40">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <GlassButton variant="glass" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </GlassButton>
        </div>

        <p className="mt-6 text-center text-xs text-foreground/50">
          By continuing you agree to our{" "}
          <Link to="/terms" className="font-medium text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="font-medium text-primary">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3 text-center text-xs text-foreground/35">CivicDesk by Stratustal</p>
      </main>
    </Shell>
  );
}
