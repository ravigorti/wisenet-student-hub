import { Sparkles, ExternalLink, Loader2, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PreRead {
  id: string;
  title: string;
  file_path: string;
  file_name: string;
  summary_status: string;
  summary_text: string | null;
  created_at: string;
  courses?: { name: string } | null;
}

const PreReadsSidebar = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: preReads = [], isLoading } = useQuery<PreRead[]>({
    queryKey: ["student-pre-reads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pre_reads")
        .select("id, title, file_path, file_name, summary_status, summary_text, created_at, courses(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as PreRead[];
    },
  });

  const handleOpenPdf = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("pre-reads")
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  // Group by date
  const grouped = preReads.reduce<Record<string, PreRead[]>>((acc, pr) => {
    const date = new Date(pr.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(pr);
    return acc;
  }, {});

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-full overflow-y-auto border-l bg-card shadow-elevated">
      <div className="border-b px-5 py-3">
        <h2 className="text-base font-semibold text-foreground">Pre-reads</h2>
      </div>
      <div className="p-4 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : preReads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No pre-reads available</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-0 z-10 mb-2 bg-card pb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {date}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((pr) => (
                  <div key={pr.id}>
                    <div className="group flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-secondary">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {pr.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pr.courses?.name || "Unknown course"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => handleOpenPdf(pr.file_path)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Open PDF
                          </button>
                          {pr.summary_status === "ready" && (
                            <button
                              onClick={() =>
                                setExpandedId(expandedId === pr.id ? null : pr.id)
                              }
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Sparkles className="h-3 w-3" /> AI Summary
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedId === pr.id && pr.summary_text && (
                      <div className="mx-2 mt-1 mb-1 rounded-md border bg-secondary p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1.5">
                          <Sparkles className="h-3 w-3" /> AI Summary
                        </p>
                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                          {pr.summary_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default PreReadsSidebar;
