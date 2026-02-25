import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, BookOpen, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  program: string;
  term: number;
  name: string;
  code: string | null;
  created_at: string;
}

const termOptions = [
  { label: "All", value: "all" },
  { label: "Term 1", value: "1" },
  { label: "Term 2", value: "2" },
  { label: "Term 3", value: "3" },
];

const PROGRAM = "PGDM (BM) 2025–27";

const CourseCards = () => {
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedTerm],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select("*")
        .eq("program", PROGRAM)
        .order("name", { ascending: true });

      if (selectedTerm !== "all") {
        query = query.eq("term", parseInt(selectedTerm));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Course[];
    },
  });

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-foreground">My Courses</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {termOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[200px] rounded-md border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading courses...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="group cursor-pointer rounded-lg border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                    {course.name}
                  </p>
                  {course.code && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {course.code}
                    </p>
                  )}
                  <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Term {course.term}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCards;
