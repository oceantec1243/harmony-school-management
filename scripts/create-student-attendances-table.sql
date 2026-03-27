-- Create student_attendances table for tracking student absences by period
CREATE TABLE IF NOT EXISTS public.student_attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  total_hours NUMERIC DEFAULT 0,
  justified_hours NUMERIC DEFAULT 0,
  unjustified_hours NUMERIC GENERATED ALWAYS AS (total_hours - justified_hours) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, academic_period_id)
);

-- Enable RLS
ALTER TABLE public.student_attendances ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all for student_attendances" ON public.student_attendances
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_attendances_student_id ON public.student_attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendances_period_id ON public.student_attendances(academic_period_id);
