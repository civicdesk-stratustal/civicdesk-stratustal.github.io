import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Home, Lock, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/glass";
import { PinLockModal } from "@/components/PinLockModal";
import { hasPin } from "@/lib/pin";
import { storeProviderToken } from "@/utils/googleCalendar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const [locked, setLocked] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    setNeedsSetup(!hasPin());
    supabase.auth.getSession().then(({ data }) => storeProviderToken(data.session?.provider_token));
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "hidden") setLocked(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const unlock = useCallback(() => {
    setLocked(false);
    setNeedsSetup(false);
  }, []);

  return (
    <Shell>
      <div className="min-h-[100dvh] pb-28">
        <Outlet />
      </div>
      <BottomNav />
      {locked ? <PinLockModal mode={needsSetup ? "setup" : "unlock"} onSuccess={unlock} /> : null}
    </Shell>
  );
}

const TABS = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/vault", label: "Vault", Icon: Lock },
  { to: "/calendar", label: "Calendar", Icon: CalendarDays },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
] as const;

function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="safe-bottom glass-strong fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-sm items-center justify-around rounded-full px-4 py-3">
      {TABS.map(({ to, label, Icon }) => {
        const active = pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className={`press flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-3 ${
              active ? "text-primary" : "text-foreground/50"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
