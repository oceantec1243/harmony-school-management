-- Add unique constraint on grades table for proper upsert
-- This allows upserting grades based on student, subject, and academic period

-- First, remove any duplicates (keep the most recent one)
DELETE FROM grades a USING grades b
WHERE a.id < b.id 
  AND a.student_id = b.student_id 
  AND a.subject_id = b.subject_id 
  AND a.academic_period_id = b.academic_period_id;

-- Add unique constraint
ALTER TABLE grades 
DROP CONSTRAINT IF EXISTS grades_student_subject_period_unique;

ALTER TABLE grades 
ADD CONSTRAINT grades_student_subject_period_unique 
UNIQUE (student_id, subject_id, academic_period_id);

-- Verify the constraint was added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'grades'::regclass;
