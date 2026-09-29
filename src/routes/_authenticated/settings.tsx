import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, KeyRound, LogOut, Moon, ShieldCheck, Sun, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassCard } from "@/components/glass";
import { PinLockModal } from "@/components/PinLockModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteAccount } from "@/lib/account.functions";
import { clearPin } from "@/lib/pin";
import { useTheme, type TextSize } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | CivicDesk" },
      {
        name: "description",
        content: "Appearance, text size, your device PIN and privacy controls.",
      },
      { property: "og:title", content: "Settings | CivicDesk" },
      { property: "og:description", content: "Appearance, PIN lock and privacy." },
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
  const [email, setEmail] = useState("");
  const [changingPin, setChangingPin] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function removeAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      clearPin();
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account");
    } finally {
      setDeleting(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
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

      <GlassCard className="mb-3">
        <GlassButton
          variant="ghost"
          className="w-full justify-start px-0 text-destructive"
          onClick={() => setConfirmDelete(true)}
          loading={deleting}
        >
          <Trash2 className="h-4 w-4" /> Delete account and data
        </GlassButton>
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={() => setConfirmSignOut(true)}>
        <LogOut className="h-4 w-4" /> Sign out
      </GlassButton>

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete your account?"
          message="This permanently removes your profile, vault items, and uploaded documents. This cannot be undone."
          confirmLabel="Delete account"
          cancelLabel="Keep account"
          destructive
          icon={<Trash2 className="h-5 w-5 text-destructive" />}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void removeAccount();
          }}
        />
      ) : null}

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
