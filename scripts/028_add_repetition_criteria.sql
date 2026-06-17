-- Migration to add repetition average and honor roll if missing
-- Date: 2026-06-16

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS min_repetition_average DECIMAL(5,2) DEFAULT 7.00,
ADD COLUMN IF NOT EXISTS min_honor_roll_average DECIMAL(5,2) DEFAULT 12.00;

COMMENT ON COLUMN classes.min_repetition_average IS 'Minimum average below which a student must repeat the year immediately';
COMMENT ON COLUMN classes.min_honor_roll_average IS 'Minimum average required for Honor Roll distinction';
