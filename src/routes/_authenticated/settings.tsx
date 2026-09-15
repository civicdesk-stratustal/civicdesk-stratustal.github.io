import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassCard } from "@/components/glass";
import { PinLockModal } from "@/components/PinLockModal";
import { clearProviderToken, getProviderToken } from "@/utils/googleCalendar";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | CivicDesk" },
      { name: "description", content: "Calendar sync, your device PIN, privacy and beta information." },
      { property: "og:title", content: "Settings | CivicDesk" },
      { property: "og:description", content: "Calendar sync, PIN lock and privacy." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sync, setSync] = useState(false);
  const [email, setEmail] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  useEffect(() => {
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

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    clearProviderToken();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="safe-top px-5">
      <h1 className="mb-1 text-xl font-bold text-white">Settings</h1>
      <p className="mb-5 truncate text-xs text-white/50">{email}</p>

      <GlassCard className="mb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarCheck className="h-4 w-4 shrink-0" /> Google Calendar sync
            </h2>
            <p className="mt-1 text-xs text-white/55">
              Add each new deadline to your calendar automatically.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={sync}
            aria-label="Google Calendar sync"
            onClick={() => toggleSync(!sync)}
            className={`press h-7 w-12 shrink-0 rounded-full border border-white/20 p-0.5 ${
              sync ? "bg-primary" : "bg-white/10"
            }`}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-white transition-transform ${
                sync ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </GlassCard>

      <GlassCard className="mb-3">
        <GlassButton variant="ghost" className="w-full justify-start px-0" onClick={() => setChangingPin(true)}>
          <KeyRound className="h-4 w-4" /> Change app PIN
        </GlassButton>
      </GlassCard>

      <GlassCard className="mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4" /> Data & privacy
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-white/60">
          Your documents and deadlines are stored privately in your own account and are never
          visible to other users. Your PIN never leaves this device.
        </p>
      </GlassCard>

      <GlassCard className="mb-3">
        <h2 className="text-sm font-semibold text-white">CivicDesk Beta</h2>
        <p className="mt-2 text-xs text-white/60">
          Version 1.0 beta by Stratustal. Document reading is simulated in this release — you can
          edit every detail before saving.
        </p>
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </GlassButton>

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
