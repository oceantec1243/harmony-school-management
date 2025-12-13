-- Add teacher_id column to level_subjects table
ALTER TABLE level_subjects ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_level_subjects_teacher_id ON level_subjects(teacher_id);
