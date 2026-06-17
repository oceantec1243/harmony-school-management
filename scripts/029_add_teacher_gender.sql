-- Migration to add gender to teachers and fix ranking scopes
-- Date: 2026-06-16

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F'));

COMMENT ON COLUMN teachers.gender IS 'Gender of the teacher to determine titles (Mr/Mme)';
