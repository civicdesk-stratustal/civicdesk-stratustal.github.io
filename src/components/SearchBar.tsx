import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchItems, type Item } from "@/lib/civic";

export function SearchBar({ onSelect }: { onSelect?: (item: Item) => void }) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchItems(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const results = data ?? [];

  return (
    <div ref={wrapRef} className="relative">
      <div className="glass flex items-center gap-2 rounded-2xl px-3">
        <Search className="h-4 w-4 shrink-0 text-foreground/50" />
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search your items"
          aria-label="Search your items"
          className="min-h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
        />
        {term ? (
          <button
            aria-label="Clear search"
            onClick={() => {
              setTerm("");
              setDebounced("");
            }}
            className="press p-1 text-foreground/50"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && debounced.trim().length >= 2 ? (
        <div className="glass-strong absolute inset-x-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl p-2">
          {isFetching && results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-foreground/60">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-foreground/60">No matching items.</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  onSelect?.(item);
                }}
                className="press block w-full rounded-xl px-3 py-2.5 text-left"
              >
                <span className="block truncate text-sm font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="block truncate text-xs text-foreground/55">
                  {item.category}
                  {item.summary ? ` · ${item.summary}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
