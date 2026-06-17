-- Migration to add honor roll criteria and finalize promotion fields
-- Date: 2026-06-16

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS min_honor_roll_average DECIMAL(5,2) DEFAULT 12.00;

COMMENT ON COLUMN classes.min_honor_roll_average IS 'Minimum average required to receive the Honor Roll (Tableau d''Honneur) distinction';
