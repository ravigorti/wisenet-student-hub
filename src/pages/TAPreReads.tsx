import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRole } from "@/hooks/useRole";
import DashboardHeader from "@/components/DashboardHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

interface Course {
  id: string;
  name: string;
  code: string | null;
  term: number;
}

interface PreRead {
  id: string;
  course_id: string;
  session_id: string | null;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_by: string | null;
  summary_status: string;
  summary_text: string | null;
  summary_prompt: string | null;
  summarized_at: string | null;
  summary_model: string | null;
  created_at: string;
  courses?: { name: string; code: string | null } | null;
}

const statusIcon = (status: string) => {
  switch (status) {
    case "generating":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    case "ready":
      return <CheckCircle2 className="h-3.5 w-3.5 text-teal" />;
    case "error":
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const TAPreReads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (getRole() !== "ta") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Summary prompt
  const [promptPreReadId, setPromptPreReadId] = useState<string | null>(null);
  const [summaryPrompt, setSummaryPrompt] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteFilePath, setDeleteFilePath] = useState("");

  // Filter
  const [filterCourse, setFilterCourse] = useState("all");

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, code, term")
        .eq("program", "PGDM (BM) 2025–27")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: preReads = [], isLoading: loadingPreReads } = useQuery<PreRead[]>({
    queryKey: ["ta-pre-reads", filterCourse],
    queryFn: async () => {
      let query = supabase
        .from("pre_reads")
        .select("*, courses(name, code)")
        .order("created_at", { ascending: false });

      if (filterCourse !== "all") {
        query = query.eq("course_id", filterCourse);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PreRead[];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf") {
      setFileError("Only PDF files are accepted.");
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("File must be under 15 MB.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error("Please select a course.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!file) {
      toast.error("Please select a PDF file.");
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const storagePath = `${selectedCourse}/${timestamp}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("pre-reads")
        .upload(storagePath, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("pre_reads").insert({
        course_id: selectedCourse,
        title: title.trim(),
        description: description.trim() || null,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: "TA",
      });

      if (dbError) throw dbError;

      toast.success("Pre-read uploaded successfully!");
      setTitle("");
      setDescription("");
      setFile(null);
      setSelectedCourse("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["ta-pre-reads"] });
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await supabase.storage.from("pre-reads").remove([deleteFilePath]);
      const { error } = await supabase.from("pre_reads").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Pre-read deleted.");
      queryClient.invalidateQueries({ queryKey: ["ta-pre-reads"] });
    } catch (err: any) {
      toast.error(err.message || "Delete failed.");
    } finally {
      setDeleteId(null);
      setDeleteFilePath("");
    }
  };

  const handleOpenPdf = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("pre-reads")
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Could not generate PDF link.");
    }
  };

  const handleGenerateSummary = async (preReadId: string) => {
    try {
      // Update status to generating
      await supabase
        .from("pre_reads")
        .update({ summary_status: "generating", summary_prompt: summaryPrompt || null })
        .eq("id", preReadId);

      queryClient.invalidateQueries({ queryKey: ["ta-pre-reads"] });

      const { data, error } = await supabase.functions.invoke("summarize", {
        body: { pre_read_id: preReadId, prompt: summaryPrompt || undefined },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Summary generated!");
      queryClient.invalidateQueries({ queryKey: ["ta-pre-reads"] });
    } catch (err: any) {
      toast.error(err.message || "Summary generation failed.");
      await supabase
        .from("pre_reads")
        .update({ summary_status: "error", summary_text: err.message || "Unknown error" })
        .eq("id", preReadId);
      queryClient.invalidateQueries({ queryKey: ["ta-pre-reads"] });
    } finally {
      setPromptPreReadId(null);
      setSummaryPrompt("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Manage Pre-reads</h1>

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="rounded-lg border bg-card p-5 space-y-4 shadow-card"
        >
          <h2 className="text-base font-semibold text-foreground">Upload New Pre-read</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Course *</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Week 4 - Chapter 7 Notes"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">PDF File * (max 15 MB)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 rounded-md border-2 border-dashed bg-secondary/30 p-4 cursor-pointer hover:border-primary/40 transition-colors"
            >
              {file ? (
                <>
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Click to select PDF</span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {fileError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload Pre-read
              </>
            )}
          </button>
        </form>

        {/* Pre-reads List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Uploaded Pre-reads</h2>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingPreReads ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : preReads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No pre-reads uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preReads.map((pr) => (
                <div
                  key={pr.id}
                  className="rounded-lg border bg-card p-4 shadow-card space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{pr.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {pr.courses?.name || "Unknown"}{" "}
                        {pr.courses?.code ? `· ${pr.courses.code}` : ""}
                      </p>
                      {pr.description && (
                        <p className="text-xs text-muted-foreground mt-1">{pr.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{pr.file_name}</span>
                        <span>{(pr.file_size / 1024).toFixed(0)} KB</span>
                        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {statusIcon(pr.summary_status)}
                        <span className="capitalize">{pr.summary_status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary text if ready */}
                  {pr.summary_status === "ready" && pr.summary_text && (
                    <div className="rounded-md border bg-secondary p-3">
                      <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3" /> AI Summary
                      </p>
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {pr.summary_text}
                      </p>
                    </div>
                  )}

                  {pr.summary_status === "error" && pr.summary_text && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                      <p className="text-xs text-destructive">{pr.summary_text}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenPdf(pr.file_path)}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> Open PDF
                    </button>
                    <button
                      onClick={() => {
                        setPromptPreReadId(pr.id);
                        setSummaryPrompt(pr.summary_prompt || "");
                      }}
                      disabled={pr.summary_status === "generating"}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" />
                      {pr.summary_status === "generating" ? "Generating…" : "Generate Summary"}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(pr.id);
                        setDeleteFilePath(pr.file_path);
                      }}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>

                  {/* Summary prompt input */}
                  {promptPreReadId === pr.id && (
                    <div className="rounded-md border bg-secondary/50 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-xs font-semibold text-foreground">
                        Prompt (optional)
                      </label>
                      <textarea
                        value={summaryPrompt}
                        onChange={(e) => setSummaryPrompt(e.target.value)}
                        placeholder="e.g. Summarize in 6 bullet points with 3 discussion questions"
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGenerateSummary(pr.id)}
                          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Sparkles className="h-3 w-3" /> Generate
                        </button>
                        <button
                          onClick={() => {
                            setPromptPreReadId(null);
                            setSummaryPrompt("");
                          }}
                          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pre-read?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the file and record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TAPreReads;
