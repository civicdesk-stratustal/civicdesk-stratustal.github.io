import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { fetchDeadlines, timeRemaining, urgencyOf } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar | CivicDesk" },
      {
        name: "description",
        content: "See every upcoming deadline on a month view and in a dated list.",
      },
      { property: "og:title", content: "Calendar | CivicDesk" },
      { property: "og:description", content: "Every upcoming deadline at a glance." },
    ],
  }),
  component: CalendarPage,
});

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const { data } = useQuery({ queryKey: ["deadlines"], queryFn: fetchDeadlines });
  const deadlines = data ?? [];

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const marked = new Set(
    deadlines
      .map((d) => new Date(d.deadline_date))
      .filter((d) => d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate()),
  );

  const upcoming = deadlines
    .filter((d) => urgencyOf(d) !== "completed")
    .sort((a, b) => +new Date(a.deadline_date) - +new Date(b.deadline_date))
    .slice(0, 8);

  return (
    <div className="safe-top px-5">
      <h1 className="mb-4 text-xl font-bold text-foreground">Calendar</h1>

      <GlassCard className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="press flex h-11 w-11 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="press flex h-11 w-11 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 text-center text-xs text-foreground/40">
          {DAY_LABELS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday =
              today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            return (
              <span
                key={day}
                className={`mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-primary font-semibold text-primary-foreground" : "text-foreground/80"
                }`}
              >
                {day}
                {marked.has(day) ? (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-amber-500" />
                ) : null}
              </span>
            );
          })}
        </div>
      </GlassCard>

      <h2 className="mb-3 text-sm font-semibold text-foreground/80">Upcoming dates</h2>
      <div className="space-y-3">
        {upcoming.length === 0 ? (
          <GlassCard className="text-center text-sm text-foreground/60">
            No upcoming deadlines.
          </GlassCard>
        ) : (
          upcoming.map((d) => (
            <GlassCard key={d.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{d.title}</h3>
                  <p className="text-xs text-foreground/55">
                    {new Date(d.deadline_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-foreground/70">{timeRemaining(d)}</span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
