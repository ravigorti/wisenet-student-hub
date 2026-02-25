
-- 1) timetable_sessions table
CREATE TABLE public.timetable_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text,
  session_date date,
  start_time time,
  end_time time,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timetable sessions are publicly readable"
  ON public.timetable_sessions FOR SELECT USING (true);

CREATE INDEX idx_timetable_sessions_course_date
  ON public.timetable_sessions(course_id, session_date);

-- 2) pre_reads table
CREATE TABLE public.pre_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.timetable_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size int NOT NULL,
  uploaded_by text,
  summary_status text NOT NULL DEFAULT 'none',
  summary_text text,
  summary_prompt text,
  summarized_at timestamptz,
  summary_model text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pre_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pre-reads are publicly readable"
  ON public.pre_reads FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pre-reads"
  ON public.pre_reads FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pre-reads"
  ON public.pre_reads FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete pre-reads"
  ON public.pre_reads FOR DELETE USING (true);

CREATE INDEX idx_pre_reads_course_created
  ON public.pre_reads(course_id, created_at DESC);

CREATE INDEX idx_pre_reads_session
  ON public.pre_reads(session_id);

CREATE INDEX idx_pre_reads_summary_status
  ON public.pre_reads(summary_status);

-- 3) Storage bucket for pre-reads (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pre-reads', 'pre-reads', false);

-- Storage policies: anyone can upload/read/delete (MVP demo without auth)
CREATE POLICY "Anyone can upload pre-reads files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pre-reads');

CREATE POLICY "Anyone can read pre-reads files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pre-reads');

CREATE POLICY "Anyone can delete pre-reads files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pre-reads');
