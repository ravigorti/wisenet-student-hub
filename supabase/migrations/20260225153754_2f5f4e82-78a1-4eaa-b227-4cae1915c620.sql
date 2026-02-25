
-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program text NOT NULL,
  term int NOT NULL,
  name text NOT NULL,
  code text,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_courses_term ON public.courses (term);
CREATE INDEX idx_courses_program_term ON public.courses (program, term);
CREATE INDEX idx_courses_program_term_name ON public.courses (program, term, name);

-- Enable RLS (public read since this is course catalog data)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are publicly readable"
  ON public.courses FOR SELECT
  USING (true);

-- Seed data
INSERT INTO public.courses (program, term, name, code) VALUES
-- Term 1
('PGDM (BM) 2025–27', 1, 'Business Communication I', 'OLS513-PBM'),
('PGDM (BM) 2025–27', 1, 'Business Policy & Strategy I', 'STR501-PBM'),
('PGDM (BM) 2025–27', 1, 'Decision Analysis Simulation', 'STR503-PBM'),
('PGDM (BM) 2025–27', 1, 'Financial Accounting and Statement Analysis', 'ACC505-PBM'),
('PGDM (BM) 2025–27', 1, 'Managerial Economics I', 'ECO502-PBM'),
('PGDM (BM) 2025–27', 1, 'Marketing Management I', 'MKT503-PBM'),
('PGDM (BM) 2025–27', 1, 'Organisational Behaviour', 'OLS505-PBM'),
('PGDM (BM) 2025–27', 1, 'Operations Management I', 'OSC503-PBM'),
('PGDM (BM) 2025–27', 1, 'Quantitative Methods I', 'QTM502-PBM'),
('PGDM (BM) 2025–27', 1, 'Science of Spirituality I', 'OLS512-PGDM-BM'),
('PGDM (BM) 2025–27', 1, 'Wise Innovation Foundation', 'INF502-PBM'),
('PGDM (BM) 2025–27', 1, 'Learning by Case Methods', NULL),
-- Term 2
('PGDM (BM) 2025–27', 2, 'Business Communication II', NULL),
('PGDM (BM) 2025–27', 2, 'Business in Digital Age', NULL),
('PGDM (BM) 2025–27', 2, 'Corporate Finance', NULL),
('PGDM (BM) 2025–27', 2, 'Data Visualization for Decision Making', NULL),
('PGDM (BM) 2025–27', 2, 'Managerial Economics II', NULL),
('PGDM (BM) 2025–27', 2, 'Marketing Management II', NULL),
('PGDM (BM) 2025–27', 2, 'Operations Management II', NULL),
('PGDM (BM) 2025–27', 2, 'Organisational Dynamics', NULL),
('PGDM (BM) 2025–27', 2, 'Quantitative Methods II', NULL),
-- Term 3
('PGDM (BM) 2025–27', 3, 'Business Policy & Strategy II', 'STR507-PBM'),
('PGDM (BM) 2025–27', 3, 'Decision Science', 'QTM522-PBM-04'),
('PGDM (BM) 2025–27', 3, 'Human Resource Management', 'OLS515-PBM-04'),
('PGDM (BM) 2025–27', 3, 'Management Accounting', 'ACC506-PBM');
