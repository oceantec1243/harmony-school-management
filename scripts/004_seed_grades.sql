-- HARMONY - Seed Grades Data
-- This creates sample grades for testing calculations

-- First, get all students from 6ème A and create grades for Sequence 1
-- Using a function to generate random grades

DO $$
DECLARE
    student_rec RECORD;
    subject_rec RECORD;
    random_score DECIMAL(5,2);
BEGIN
    -- Loop through all students in 6ème A
    FOR student_rec IN 
        SELECT id FROM students 
        WHERE class_id = 'cccc0001-0001-0001-0001-000000000001'
    LOOP
        -- Loop through all subjects assigned to 6ème A
        FOR subject_rec IN 
            SELECT cs.subject_id, cs.coefficient 
            FROM class_subjects cs 
            WHERE cs.class_id = 'cccc0001-0001-0001-0001-000000000001'
        LOOP
            -- Generate a realistic random score (between 5 and 19)
            random_score := 5 + (random() * 14)::DECIMAL(5,2);
            random_score := round(random_score * 4) / 4; -- Round to nearest 0.25
            
            -- Insert grade for Sequence 1
            INSERT INTO grades (student_id, subject_id, academic_period_id, score, coefficient)
            VALUES (student_rec.id, subject_rec.subject_id, 'pppp0001-0001-0001-0001-000000000002', random_score, subject_rec.coefficient)
            ON CONFLICT (student_id, subject_id, academic_period_id) DO UPDATE SET score = random_score;
            
            -- Insert grade for Sequence 2 with slight variation
            random_score := random_score + (random() * 4 - 2);
            random_score := GREATEST(0, LEAST(20, random_score));
            random_score := round(random_score * 4) / 4;
            
            INSERT INTO grades (student_id, subject_id, academic_period_id, score, coefficient)
            VALUES (student_rec.id, subject_rec.subject_id, 'pppp0001-0001-0001-0001-000000000003', random_score, subject_rec.coefficient)
            ON CONFLICT (student_id, subject_id, academic_period_id) DO UPDATE SET score = random_score;
        END LOOP;
    END LOOP;
    
    -- Same for 6ème B students
    FOR student_rec IN 
        SELECT id FROM students 
        WHERE class_id = 'cccc0001-0001-0001-0001-000000000002'
    LOOP
        FOR subject_rec IN 
            SELECT cs.subject_id, cs.coefficient 
            FROM class_subjects cs 
            WHERE cs.class_id = 'cccc0001-0001-0001-0001-000000000001' -- Use same subjects
        LOOP
            random_score := 5 + (random() * 14)::DECIMAL(5,2);
            random_score := round(random_score * 4) / 4;
            
            INSERT INTO grades (student_id, subject_id, academic_period_id, score, coefficient)
            VALUES (student_rec.id, subject_rec.subject_id, 'pppp0001-0001-0001-0001-000000000002', random_score, subject_rec.coefficient)
            ON CONFLICT (student_id, subject_id, academic_period_id) DO UPDATE SET score = random_score;
            
            random_score := random_score + (random() * 4 - 2);
            random_score := GREATEST(0, LEAST(20, random_score));
            random_score := round(random_score * 4) / 4;
            
            INSERT INTO grades (student_id, subject_id, academic_period_id, score, coefficient)
            VALUES (student_rec.id, subject_rec.subject_id, 'pppp0001-0001-0001-0001-000000000003', random_score, subject_rec.coefficient)
            ON CONFLICT (student_id, subject_id, academic_period_id) DO UPDATE SET score = random_score;
        END LOOP;
    END LOOP;
END $$;
