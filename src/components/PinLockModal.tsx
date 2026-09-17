import { useEffect, useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";
import { setPin as savePin, verifyPin } from "@/lib/pin";

type Mode = "unlock" | "setup" | "change";

export function PinLockModal({
  mode,
  onSuccess,
  onCancel,
}: {
  mode: Mode;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [entry, setEntry] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");

  const settingUp = mode !== "unlock";

  useEffect(() => {
    if (entry.length !== 4) return;
    const t = setTimeout(() => {
      if (!settingUp) {
        if (verifyPin(entry)) onSuccess();
        else {
          setError("Incorrect PIN");
          setEntry("");
        }
        return;
      }
      if (confirming === null) {
        setConfirming(entry);
        setEntry("");
        setError("");
      } else if (confirming === entry) {
        savePin(entry);
        onSuccess();
      } else {
        setError("PINs did not match, start again");
        setConfirming(null);
        setEntry("");
      }
    }, 120);
    return () => clearTimeout(t);
  }, [entry, confirming, settingUp, onSuccess]);

  const title = !settingUp
    ? "Enter your PIN"
    : confirming === null
      ? "Create a 4-digit PIN"
      : "Confirm your PIN";

  const press = (digit: string) => setEntry((e) => (e.length < 4 ? e + digit : e));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-2xl">
      <div className="glass w-full max-w-sm rounded-3xl p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-foreground/60">
          {settingUp
            ? "Your PIN stays on this device and locks CivicDesk when you switch away."
            : "CivicDesk locked while you were away."}
        </p>

        <div className="my-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full border border-foreground/30 ${
                entry.length > i ? "bg-foreground" : "bg-foreground/10"
              }`}
            />
          ))}
        </div>

        {error ? <p className="mb-3 text-xs text-destructive">{error}</p> : null}

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <KeyButton key={d} onClick={() => press(d)}>
              {d}
            </KeyButton>
          ))}
          <KeyButton onClick={() => setEntry("")} subtle>
            <span className="text-xs font-medium">Clear</span>
          </KeyButton>
          <KeyButton onClick={() => press("0")}>0</KeyButton>
          <KeyButton onClick={() => setEntry((e) => e.slice(0, -1))} subtle>
            <Delete className="h-5 w-5" />
          </KeyButton>
        </div>

        {onCancel ? (
          <button
            onClick={onCancel}
            className="press mt-5 min-h-11 w-full rounded-2xl text-sm font-medium text-foreground/60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

function KeyButton({
  children,
  onClick,
  subtle,
}: {
  children: React.ReactNode;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border text-xl font-semibold text-foreground ${
        subtle ? "bg-foreground/[0.04] text-foreground/70" : "bg-foreground/[0.08]"
      }`}
    >
      {children}
    </button>
  );
}
