import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarCheck,
  FileText,
  KeyRound,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Type,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassCard } from "@/components/glass";
import { PinLockModal } from "@/components/PinLockModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  authorizeGoogleCalendar,
  clearProviderToken,
  getProviderToken,
} from "@/utils/googleCalendar";
import { useTheme, type TextSize } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | CivicDesk" },
      {
        name: "description",
        content: "Appearance, text size, calendar sync, your device PIN and privacy controls.",
      },
      { property: "og:title", content: "Settings | CivicDesk" },
      { property: "og:description", content: "Appearance, calendar sync, PIN lock and privacy." },
    ],
  }),
  component: SettingsPage,
});

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, setTheme, textSize, setTextSize } = useTheme();
  const [sync, setSync] = useState(false);
  const [email, setEmail] = useState("");
  const [changingPin, setChangingPin] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getProviderToken());
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    supabase
      .from("profiles")
      .select("preferences")
      .maybeSingle()
      .then(({ data }) => {
        const prefs = data?.preferences as { calendar_sync?: boolean } | null;
        setSync(!!prefs?.calendar_sync);
      });
  }, []);

  async function toggleSync(next: boolean) {
    setSync(next);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ preferences: { calendar_sync: next } })
      .eq("id", u.user.id);
    if (error) {
      setSync(!next);
      toast.error("Could not save that setting");
      return;
    }
    if (next && !getProviderToken()) {
      toast.message("Sign in with Google to let CivicDesk add events to your calendar.");
    } else {
      toast.success(next ? "Calendar sync on" : "Calendar sync off");
    }
  }

  async function reauthorize() {
    try {
      await authorizeGoogleCalendar();
    } catch {
      toast.error("Could not open Google authorization");
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    clearProviderToken();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="safe-top px-5">
      <h1 className="mb-1 text-xl font-bold text-foreground">Settings</h1>
      <p className="mb-5 truncate text-xs text-foreground/50">{email}</p>

      <GlassCard className="mb-3">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`press min-h-11 rounded-2xl border text-sm font-medium capitalize ${
                theme === t
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-foreground/[0.05] text-foreground/70"
              }`}
            >
              {t} mode
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="mb-3">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Type className="h-4 w-4" /> Text size
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {TEXT_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setTextSize(s.value)}
              className={`press min-h-11 rounded-2xl border text-sm font-medium ${
                textSize === s.value
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-foreground/[0.05] text-foreground/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="mb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarCheck className="h-4 w-4 shrink-0" /> Google Calendar sync
            </h2>
            <p className="mt-1 text-xs text-foreground/55">
              Add each new deadline to your calendar automatically.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={sync}
            aria-label="Google Calendar sync"
            onClick={() => toggleSync(!sync)}
            className={`press h-7 w-12 shrink-0 rounded-full border border-border p-0.5 ${
              sync ? "bg-primary" : "bg-foreground/10"
            }`}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                sync ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        <GlassButton variant="glass" className="mt-3 w-full" onClick={reauthorize}>
          <CalendarCheck className="h-4 w-4" />
          {hasToken ? "Re-authorize Google Calendar" : "Authorize Google Calendar"}
        </GlassButton>
      </GlassCard>

      <GlassCard className="mb-3">
        <GlassButton
          variant="ghost"
          className="w-full justify-start px-0"
          onClick={() => setChangingPin(true)}
        >
          <KeyRound className="h-4 w-4" /> Change app PIN
        </GlassButton>
      </GlassCard>

      <GlassCard className="mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4" /> Data & privacy
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-foreground/60">
          Your documents and deadlines are isolated to your own account with row-level security and
          are never visible to other users. Your PIN never leaves this device.
        </p>
      </GlassCard>

      <GlassCard className="mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4" /> Legal
        </h2>
        <div className="mt-2 flex gap-4 text-xs font-medium text-primary">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
        <p className="mt-3 text-xs text-foreground/50">CivicDesk version 1.0 by Stratustal</p>
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={() => setConfirmSignOut(true)}>
        <LogOut className="h-4 w-4" /> Sign out
      </GlassButton>

      {confirmSignOut ? (
        <ConfirmDialog
          title="Sign out?"
          message="Are you sure you want to sign out? You will need your credentials to access your Vault again."
          confirmLabel="Sign Out"
          cancelLabel="Cancel"
          destructive
          icon={<LogOut className="h-5 w-5 text-destructive" />}
          onCancel={() => setConfirmSignOut(false)}
          onConfirm={() => {
            setConfirmSignOut(false);
            void signOut();
          }}
        />
      ) : null}

      {changingPin ? (
        <PinLockModal
          mode="change"
          onCancel={() => setChangingPin(false)}
          onSuccess={() => {
            setChangingPin(false);
            toast.success("PIN updated");
          }}
        />
      ) : null}
    </div>
  );
}
