import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileWarning, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton } from "@/components/glass";

type Doc = { path: string; url: string; isPdf: boolean };

export function DocumentViewer({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("documents")
        .select("file_path")
        .eq("item_id", itemId)
        .order("created_at", { ascending: true });

      const paths = (data ?? []).map((d) => d.file_path).filter((p): p is string => !!p);

      const resolved = await Promise.all(
        paths.map(async (path) => {
          const { data: signed } = await supabase.storage
            .from("documents")
            .createSignedUrl(path, 60 * 30);
          const url =
            signed?.signedUrl ??
            supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
          return { path, url, isPdf: path.toLowerCase().endsWith(".pdf") };
        }),
      );
      if (!cancelled) setDocs(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const current = docs?.[index];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background/90 backdrop-blur-2xl">
      <div className="safe-top flex items-center justify-between px-5 py-4">
        <span className="truncate text-sm font-semibold text-foreground">
          {docs && docs.length > 1 ? `Document ${index + 1} of ${docs.length}` : "Document"}
        </span>
        <button
          onClick={onClose}
          aria-label="Close document"
          className="press glass flex h-11 w-11 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5 text-foreground/80" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto px-4 pb-4">
        {docs === null ? (
          <div className="glass h-3/4 w-full animate-pulse rounded-3xl" />
        ) : !current ? (
          <div className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center text-sm text-foreground/65">
            <FileWarning className="h-7 w-7 text-foreground/50" />
            No file was stored for this item.
          </div>
        ) : current.isPdf ? (
          <iframe
            title="Document"
            src={current.url}
            className="glass h-full min-h-[60dvh] w-full rounded-3xl"
          />
        ) : (
          <img
            src={current.url}
            alt="Uploaded document"
            className="glass max-h-full w-full rounded-3xl object-contain p-2"
          />
        )}
      </div>

      {docs && docs.length > 1 ? (
        <div className="safe-bottom flex items-center justify-between gap-3 px-5 pb-5">
          <GlassButton
            variant="glass"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </GlassButton>
          <GlassButton
            variant="glass"
            disabled={index === docs.length - 1}
            onClick={() => setIndex((i) => Math.min(docs.length - 1, i + 1))}
          >
            Next <ChevronRight className="h-4 w-4" />
          </GlassButton>
        </div>
      ) : null}
    </div>
  );
}
