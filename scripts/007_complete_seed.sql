-- HARMONY - Script d'initialisation complet
-- Ce script ajoute toutes les données de base nécessaires

-- 1. Ajouter section_id à subject_groups si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subject_groups' AND column_name = 'section_id'
    ) THEN
        ALTER TABLE subject_groups ADD COLUMN section_id uuid REFERENCES sections(id);
    END IF;
END $$;

-- 2. Créer les sections si elles n'existent pas
INSERT INTO sections (id, name, description)
SELECT gen_random_uuid(), 'Francophone', 'Section francophone du système éducatif camerounais'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Francophone');

INSERT INTO sections (id, name, description)
SELECT gen_random_uuid(), 'Anglophone', 'Anglophone section of the Cameroonian education system'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Anglophone');

-- 3. Créer les niveaux francophones
DO $$
DECLARE
    fr_section_id uuid;
BEGIN
    SELECT id INTO fr_section_id FROM sections WHERE name = 'Francophone';
    
    IF fr_section_id IS NOT NULL THEN
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), '6ème', fr_section_id, 1
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = '6ème' AND section_id = fr_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), '5ème', fr_section_id, 2
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = '5ème' AND section_id = fr_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), '4ème', fr_section_id, 3
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = '4ème' AND section_id = fr_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), '3ème', fr_section_id, 4
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = '3ème' AND section_id = fr_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), '2nde', fr_section_id, 5
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = '2nde' AND section_id = fr_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), '1ère', fr_section_id, 6
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = '1ère' AND section_id = fr_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Tle', fr_section_id, 7
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Tle' AND section_id = fr_section_id);
    END IF;
END $$;

-- 4. Créer les niveaux anglophones
DO $$
DECLARE
    en_section_id uuid;
BEGIN
    SELECT id INTO en_section_id FROM sections WHERE name = 'Anglophone';
    
    IF en_section_id IS NOT NULL THEN
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Form 1', en_section_id, 1
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Form 1' AND section_id = en_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Form 2', en_section_id, 2
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Form 2' AND section_id = en_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Form 3', en_section_id, 3
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Form 3' AND section_id = en_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Form 4', en_section_id, 4
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Form 4' AND section_id = en_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Form 5', en_section_id, 5
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Form 5' AND section_id = en_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Lower Sixth', en_section_id, 6
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Lower Sixth' AND section_id = en_section_id);
        
        INSERT INTO levels (id, name, section_id, "order")
        SELECT gen_random_uuid(), 'Upper Sixth', en_section_id, 7
        WHERE NOT EXISTS (SELECT 1 FROM levels WHERE name = 'Upper Sixth' AND section_id = en_section_id);
    END IF;
END $$;

-- 5. Créer les groupes de matières francophones
DO $$
DECLARE
    fr_section_id uuid;
BEGIN
    SELECT id INTO fr_section_id FROM sections WHERE name = 'Francophone';
    
    IF fr_section_id IS NOT NULL THEN
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Groupe I - Lettres', 1, fr_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Groupe I - Lettres' AND section_id = fr_section_id);
        
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Groupe II - Sciences', 2, fr_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Groupe II - Sciences' AND section_id = fr_section_id);
        
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Groupe III - Sciences Humaines', 3, fr_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Groupe III - Sciences Humaines' AND section_id = fr_section_id);
        
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Groupe IV - Autres', 4, fr_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Groupe IV - Autres' AND section_id = fr_section_id);
    END IF;
END $$;

-- 6. Créer les groupes de matières anglophones
DO $$
DECLARE
    en_section_id uuid;
BEGIN
    SELECT id INTO en_section_id FROM sections WHERE name = 'Anglophone';
    
    IF en_section_id IS NOT NULL THEN
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Group I - Languages', 1, en_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Group I - Languages' AND section_id = en_section_id);
        
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Group II - Sciences', 2, en_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Group II - Sciences' AND section_id = en_section_id);
        
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Group III - Humanities', 3, en_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Group III - Humanities' AND section_id = en_section_id);
        
        INSERT INTO subject_groups (id, name, "order", section_id)
        SELECT gen_random_uuid(), 'Group IV - Others', 4, en_section_id
        WHERE NOT EXISTS (SELECT 1 FROM subject_groups WHERE name = 'Group IV - Others' AND section_id = en_section_id);
    END IF;
END $$;

-- 7. Créer les matières francophones
DO $$
DECLARE
    fr_section_id uuid;
    group_lettres_id uuid;
    group_sciences_id uuid;
    group_humaines_id uuid;
    group_autres_id uuid;
BEGIN
    SELECT id INTO fr_section_id FROM sections WHERE name = 'Francophone';
    SELECT id INTO group_lettres_id FROM subject_groups WHERE name = 'Groupe I - Lettres' AND section_id = fr_section_id;
    SELECT id INTO group_sciences_id FROM subject_groups WHERE name = 'Groupe II - Sciences' AND section_id = fr_section_id;
    SELECT id INTO group_humaines_id FROM subject_groups WHERE name = 'Groupe III - Sciences Humaines' AND section_id = fr_section_id;
    SELECT id INTO group_autres_id FROM subject_groups WHERE name = 'Groupe IV - Autres' AND section_id = fr_section_id;
    
    IF group_lettres_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'Français', 'FR', group_lettres_id, 'Langue française et littérature'),
        (gen_random_uuid(), 'Anglais', 'AN', group_lettres_id, 'Langue anglaise'),
        (gen_random_uuid(), 'Allemand', 'ALL', group_lettres_id, 'Langue allemande'),
        (gen_random_uuid(), 'Espagnol', 'ESP', group_lettres_id, 'Langue espagnole'),
        (gen_random_uuid(), 'Latin', 'LAT', group_lettres_id, 'Langue latine')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF group_sciences_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'Mathématiques', 'MATH', group_sciences_id, 'Mathématiques'),
        (gen_random_uuid(), 'Physique', 'PHY', group_sciences_id, 'Physique'),
        (gen_random_uuid(), 'Chimie', 'CHI', group_sciences_id, 'Chimie'),
        (gen_random_uuid(), 'Sciences de la Vie et de la Terre', 'SVT', group_sciences_id, 'SVT'),
        (gen_random_uuid(), 'Informatique', 'INFO', group_sciences_id, 'Informatique'),
        (gen_random_uuid(), 'PCT', 'PCT', group_sciences_id, 'Physique Chimie Technologie')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF group_humaines_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'Histoire', 'HIS', group_humaines_id, 'Histoire'),
        (gen_random_uuid(), 'Géographie', 'GEO', group_humaines_id, 'Géographie'),
        (gen_random_uuid(), 'ECM', 'ECM', group_humaines_id, 'Education Civique et Morale'),
        (gen_random_uuid(), 'Philosophie', 'PHI', group_humaines_id, 'Philosophie')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF group_autres_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'EPS', 'EPS', group_autres_id, 'Education Physique et Sportive'),
        (gen_random_uuid(), 'Musique', 'MUS', group_autres_id, 'Education musicale'),
        (gen_random_uuid(), 'Arts Plastiques', 'ART', group_autres_id, 'Arts plastiques'),
        (gen_random_uuid(), 'Travaux Manuels', 'TM', group_autres_id, 'Travaux manuels')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 8. Créer les matières anglophones
DO $$
DECLARE
    en_section_id uuid;
    group_languages_id uuid;
    group_sciences_id uuid;
    group_humanities_id uuid;
    group_others_id uuid;
BEGIN
    SELECT id INTO en_section_id FROM sections WHERE name = 'Anglophone';
    SELECT id INTO group_languages_id FROM subject_groups WHERE name = 'Group I - Languages' AND section_id = en_section_id;
    SELECT id INTO group_sciences_id FROM subject_groups WHERE name = 'Group II - Sciences' AND section_id = en_section_id;
    SELECT id INTO group_humanities_id FROM subject_groups WHERE name = 'Group III - Humanities' AND section_id = en_section_id;
    SELECT id INTO group_others_id FROM subject_groups WHERE name = 'Group IV - Others' AND section_id = en_section_id;
    
    IF group_languages_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'English Language', 'ENG', group_languages_id, 'English Language and Literature'),
        (gen_random_uuid(), 'French', 'FRE', group_languages_id, 'French Language'),
        (gen_random_uuid(), 'Literature in English', 'LIT', group_languages_id, 'Literature in English')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF group_sciences_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'Mathematics', 'MTH', group_sciences_id, 'Mathematics'),
        (gen_random_uuid(), 'Physics', 'PHY', group_sciences_id, 'Physics'),
        (gen_random_uuid(), 'Chemistry', 'CHE', group_sciences_id, 'Chemistry'),
        (gen_random_uuid(), 'Biology', 'BIO', group_sciences_id, 'Biology'),
        (gen_random_uuid(), 'Computer Science', 'CS', group_sciences_id, 'Computer Science'),
        (gen_random_uuid(), 'Further Mathematics', 'FMT', group_sciences_id, 'Further Mathematics')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF group_humanities_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'History', 'HIS', group_humanities_id, 'History'),
        (gen_random_uuid(), 'Geography', 'GEG', group_humanities_id, 'Geography'),
        (gen_random_uuid(), 'Economics', 'ECO', group_humanities_id, 'Economics'),
        (gen_random_uuid(), 'Citizenship Education', 'CIT', group_humanities_id, 'Citizenship Education')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF group_others_id IS NOT NULL THEN
        INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
        (gen_random_uuid(), 'Physical Education', 'PE', group_others_id, 'Physical Education'),
        (gen_random_uuid(), 'Music', 'MUS', group_others_id, 'Music'),
        (gen_random_uuid(), 'Fine Arts', 'ART', group_others_id, 'Fine Arts')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 9. Créer les périodes académiques
DO $$
DECLARE
    trim1_id uuid;
    trim2_id uuid;
    trim3_id uuid;
BEGIN
    -- Trimestre 1
    IF NOT EXISTS (SELECT 1 FROM academic_periods WHERE name = 'Trimestre 1' AND academic_year = '2024-2025') THEN
        INSERT INTO academic_periods (id, name, type, academic_year, number, start_date, end_date)
        VALUES (gen_random_uuid(), 'Trimestre 1', 'trimester', '2024-2025', 1, '2024-09-02', '2024-12-20')
        RETURNING id INTO trim1_id;
        
        -- Séquences du trimestre 1
        INSERT INTO academic_periods (id, name, type, academic_year, number, start_date, end_date, parent_id) VALUES
        (gen_random_uuid(), 'Séquence 1', 'sequence', '2024-2025', 1, '2024-09-02', '2024-10-25', trim1_id),
        (gen_random_uuid(), 'Séquence 2', 'sequence', '2024-2025', 2, '2024-10-28', '2024-12-20', trim1_id);
    END IF;
    
    -- Trimestre 2
    IF NOT EXISTS (SELECT 1 FROM academic_periods WHERE name = 'Trimestre 2' AND academic_year = '2024-2025') THEN
        INSERT INTO academic_periods (id, name, type, academic_year, number, start_date, end_date)
        VALUES (gen_random_uuid(), 'Trimestre 2', 'trimester', '2024-2025', 2, '2025-01-06', '2025-03-28')
        RETURNING id INTO trim2_id;
        
        -- Séquences du trimestre 2
        INSERT INTO academic_periods (id, name, type, academic_year, number, start_date, end_date, parent_id) VALUES
        (gen_random_uuid(), 'Séquence 3', 'sequence', '2024-2025', 3, '2025-01-06', '2025-02-14', trim2_id),
        (gen_random_uuid(), 'Séquence 4', 'sequence', '2024-2025', 4, '2025-02-17', '2025-03-28', trim2_id);
    END IF;
    
    -- Trimestre 3
    IF NOT EXISTS (SELECT 1 FROM academic_periods WHERE name = 'Trimestre 3' AND academic_year = '2024-2025') THEN
        INSERT INTO academic_periods (id, name, type, academic_year, number, start_date, end_date)
        VALUES (gen_random_uuid(), 'Trimestre 3', 'trimester', '2024-2025', 3, '2025-04-07', '2025-06-30')
        RETURNING id INTO trim3_id;
        
        -- Séquences du trimestre 3
        INSERT INTO academic_periods (id, name, type, academic_year, number, start_date, end_date, parent_id) VALUES
        (gen_random_uuid(), 'Séquence 5', 'sequence', '2024-2025', 5, '2025-04-07', '2025-05-16', trim3_id),
        (gen_random_uuid(), 'Séquence 6', 'sequence', '2024-2025', 6, '2025-05-19', '2025-06-30', trim3_id);
    END IF;
END $$;

-- 10. Créer les paramètres de l'école
INSERT INTO school_settings (
    id,
    school_name,
    school_slogan,
    address,
    phone,
    email,
    current_academic_year,
    grading_scale
)
SELECT 
    gen_random_uuid(),
    'HARMONY - Établissement Scolaire',
    'L''harmonie entre technologie et éducation',
    'Yaoundé, Cameroun',
    '+237 6XX XXX XXX',
    'contact@harmony.edu',
    '2024-2025',
    20
WHERE NOT EXISTS (SELECT 1 FROM school_settings);
