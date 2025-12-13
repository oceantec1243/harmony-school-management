-- Add teacher_id to level_subjects table
ALTER TABLE level_subjects ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- Create attendances table for tracking student absences
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  total_hours NUMERIC DEFAULT 0,
  justified_hours NUMERIC DEFAULT 0,
  unjustified_hours NUMERIC GENERATED ALWAYS AS (total_hours - justified_hours) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, academic_period_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_period ON attendances(academic_period_id);

-- Enable RLS
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for attendances" ON attendances FOR ALL USING (true);

COMMENT ON TABLE attendances IS 'Stores student attendance records per academic period';
COMMENT ON COLUMN attendances.unjustified_hours IS 'Calculated automatically as total_hours - justified_hours';
