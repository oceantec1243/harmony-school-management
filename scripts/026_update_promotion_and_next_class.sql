-- Migration to update promotion, next class and rattrapage criteria
-- Date: 2026-06-16

-- 1. Add columns to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS min_promotion_average DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS min_rattrapage_average DECIMAL(5,2) DEFAULT 8.00,
ADD COLUMN IF NOT EXISTS unranked_coef_threshold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- 2. Add comments
COMMENT ON COLUMN classes.min_promotion_average IS 'Minimum average required for automatic promotion';
COMMENT ON COLUMN classes.min_rattrapage_average IS 'Minimum average to be eligible for resits (rattrapages) instead of immediate repetition';
COMMENT ON COLUMN classes.next_class_id IS 'Reference to the class students move to upon promotion';

-- 3. Update existing data if possible (optional logic can go here)
