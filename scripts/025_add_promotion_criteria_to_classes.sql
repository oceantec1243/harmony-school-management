-- Migration to add promotion and unranked criteria to classes
-- Date: 2026-06-16

-- Add min_promotion_average: Minimum average required to pass to next class
-- Add unranked_coef_threshold: Max sum of coefficients of missed exams before being "Non Classé"

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS min_promotion_average DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS unranked_coef_threshold INTEGER DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN classes.min_promotion_average IS 'Minimum average required for promotion to the next class';
COMMENT ON COLUMN classes.unranked_coef_threshold IS 'Threshold of total coefficients for non-composed subjects to mark a student as unranked (0 means disabled)';
