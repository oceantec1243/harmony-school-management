-- Script pour mettre à jour le schéma et ajouter section_id aux subject_groups
-- Ajouter section_id aux subject_groups pour séparer Francophone/Anglophone

ALTER TABLE subject_groups ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES sections(id);

-- Créer les données initiales si elles n'existent pas

-- Sections
INSERT INTO sections (id, name, description)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Francophone', 'Section francophone'),
  ('22222222-2222-2222-2222-222222222222', 'Anglophone', 'Section anglophone - English section')
ON CONFLICT (id) DO NOTHING;

-- Niveaux Francophone
INSERT INTO levels (id, name, section_id, "order")
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6ème', '11111111-1111-1111-1111-111111111111', 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5ème', '11111111-1111-1111-1111-111111111111', 2),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '4ème', '11111111-1111-1111-1111-111111111111', 3),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '3ème', '11111111-1111-1111-1111-111111111111', 4),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2nde', '11111111-1111-1111-1111-111111111111', 5),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '1ère', '11111111-1111-1111-1111-111111111111', 6),
  ('00000000-0000-0000-0000-000000000001', 'Tle', '11111111-1111-1111-1111-111111111111', 7)
ON CONFLICT (id) DO NOTHING;

-- Niveaux Anglophone
INSERT INTO levels (id, name, section_id, "order")
VALUES
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Form 1', '22222222-2222-2222-2222-222222222222', 1),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Form 2', '22222222-2222-2222-2222-222222222222', 2),
  ('33333333-cccc-cccc-cccc-cccccccccccc', 'Form 3', '22222222-2222-2222-2222-222222222222', 3),
  ('44444444-dddd-dddd-dddd-dddddddddddd', 'Form 4', '22222222-2222-2222-2222-222222222222', 4),
  ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', 'Form 5', '22222222-2222-2222-2222-222222222222', 5),
  ('66666666-ffff-ffff-ffff-ffffffffffff', 'Lower Sixth', '22222222-2222-2222-2222-222222222222', 6),
  ('77777777-0000-0000-0000-000000000001', 'Upper Sixth', '22222222-2222-2222-2222-222222222222', 7)
ON CONFLICT (id) DO NOTHING;

-- Groupes de matières Francophone
INSERT INTO subject_groups (id, name, "order", section_id)
VALUES
  ('g1111111-1111-1111-1111-111111111111', 'Groupe I - Lettres & Langues', 1, '11111111-1111-1111-1111-111111111111'),
  ('g2222222-2222-2222-2222-222222222222', 'Groupe II - Sciences', 2, '11111111-1111-1111-1111-111111111111'),
  ('g3333333-3333-3333-3333-333333333333', 'Groupe III - Sciences Humaines', 3, '11111111-1111-1111-1111-111111111111'),
  ('g4444444-4444-4444-4444-444444444444', 'Groupe IV - Éducation', 4, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Groupes de matières Anglophone  
INSERT INTO subject_groups (id, name, "order", section_id)
VALUES
  ('ga111111-1111-1111-1111-111111111111', 'Group I - Languages', 1, '22222222-2222-2222-2222-222222222222'),
  ('ga222222-2222-2222-2222-222222222222', 'Group II - Sciences', 2, '22222222-2222-2222-2222-222222222222'),
  ('ga333333-3333-3333-3333-333333333333', 'Group III - Social Sciences', 3, '22222222-2222-2222-2222-222222222222'),
  ('ga444444-4444-4444-4444-444444444444', 'Group IV - Education', 4, '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Matières Francophones
INSERT INTO subjects (id, name, code, subject_group_id, description)
VALUES
  -- Groupe I - Lettres & Langues
  ('s1111111-1111-1111-1111-111111111111', 'Français', 'FR', 'g1111111-1111-1111-1111-111111111111', 'Langue française'),
  ('s1111111-1111-1111-1111-111111111112', 'Anglais', 'ANG', 'g1111111-1111-1111-1111-111111111111', 'Langue anglaise (LV1)'),
  ('s1111111-1111-1111-1111-111111111113', 'Espagnol', 'ESP', 'g1111111-1111-1111-1111-111111111111', 'Langue espagnole (LV2)'),
  ('s1111111-1111-1111-1111-111111111114', 'Allemand', 'ALL', 'g1111111-1111-1111-1111-111111111111', 'Langue allemande (LV2)'),
  ('s1111111-1111-1111-1111-111111111115', 'Latin', 'LAT', 'g1111111-1111-1111-1111-111111111111', 'Langue latine'),
  -- Groupe II - Sciences
  ('s2222222-2222-2222-2222-222222222221', 'Mathématiques', 'MATH', 'g2222222-2222-2222-2222-222222222222', 'Mathématiques'),
  ('s2222222-2222-2222-2222-222222222222', 'Physique', 'PHY', 'g2222222-2222-2222-2222-222222222222', 'Physique'),
  ('s2222222-2222-2222-2222-222222222223', 'Chimie', 'CHIM', 'g2222222-2222-2222-2222-222222222222', 'Chimie'),
  ('s2222222-2222-2222-2222-222222222224', 'SVT', 'SVT', 'g2222222-2222-2222-2222-222222222222', 'Sciences de la Vie et de la Terre'),
  ('s2222222-2222-2222-2222-222222222225', 'Informatique', 'INFO', 'g2222222-2222-2222-2222-222222222222', 'Informatique'),
  -- Groupe III - Sciences Humaines
  ('s3333333-3333-3333-3333-333333333331', 'Histoire', 'HIST', 'g3333333-3333-3333-3333-333333333333', 'Histoire'),
  ('s3333333-3333-3333-3333-333333333332', 'Géographie', 'GEO', 'g3333333-3333-3333-3333-333333333333', 'Géographie'),
  ('s3333333-3333-3333-3333-333333333333', 'ECM', 'ECM', 'g3333333-3333-3333-3333-333333333333', 'Éducation Civique et Morale'),
  ('s3333333-3333-3333-3333-333333333334', 'Philosophie', 'PHILO', 'g3333333-3333-3333-3333-333333333333', 'Philosophie'),
  -- Groupe IV - Éducation
  ('s4444444-4444-4444-4444-444444444441', 'EPS', 'EPS', 'g4444444-4444-4444-4444-444444444444', 'Éducation Physique et Sportive'),
  ('s4444444-4444-4444-4444-444444444442', 'Musique', 'MUS', 'g4444444-4444-4444-4444-444444444444', 'Éducation Musicale'),
  ('s4444444-4444-4444-4444-444444444443', 'Dessin', 'DESS', 'g4444444-4444-4444-4444-444444444444', 'Arts Plastiques')
ON CONFLICT (id) DO NOTHING;

-- Matières Anglophones
INSERT INTO subjects (id, name, code, subject_group_id, description)
VALUES
  -- Group I - Languages
  ('sa111111-1111-1111-1111-111111111111', 'English Language', 'ENG', 'ga111111-1111-1111-1111-111111111111', 'English Language'),
  ('sa111111-1111-1111-1111-111111111112', 'French', 'FRE', 'ga111111-1111-1111-1111-111111111111', 'French Language'),
  ('sa111111-1111-1111-1111-111111111113', 'Literature', 'LIT', 'ga111111-1111-1111-1111-111111111111', 'English Literature'),
  -- Group II - Sciences
  ('sa222222-2222-2222-2222-222222222221', 'Mathematics', 'MATH', 'ga222222-2222-2222-2222-222222222222', 'Mathematics'),
  ('sa222222-2222-2222-2222-222222222222', 'Physics', 'PHY', 'ga222222-2222-2222-2222-222222222222', 'Physics'),
  ('sa222222-2222-2222-2222-222222222223', 'Chemistry', 'CHEM', 'ga222222-2222-2222-2222-222222222222', 'Chemistry'),
  ('sa222222-2222-2222-2222-222222222224', 'Biology', 'BIO', 'ga222222-2222-2222-2222-222222222222', 'Biology'),
  ('sa222222-2222-2222-2222-222222222225', 'Computer Science', 'CS', 'ga222222-2222-2222-2222-222222222222', 'Computer Science'),
  -- Group III - Social Sciences
  ('sa333333-3333-3333-3333-333333333331', 'History', 'HIST', 'ga333333-3333-3333-3333-333333333333', 'History'),
  ('sa333333-3333-3333-3333-333333333332', 'Geography', 'GEO', 'ga333333-3333-3333-3333-333333333333', 'Geography'),
  ('sa333333-3333-3333-3333-333333333333', 'Citizenship', 'CIT', 'ga333333-3333-3333-3333-333333333333', 'Citizenship Education'),
  ('sa333333-3333-3333-3333-333333333334', 'Economics', 'ECON', 'ga333333-3333-3333-3333-333333333333', 'Economics'),
  -- Group IV - Education
  ('sa444444-4444-4444-4444-444444444441', 'Physical Education', 'PE', 'ga444444-4444-4444-4444-444444444444', 'Physical Education'),
  ('sa444444-4444-4444-4444-444444444442', 'Music', 'MUS', 'ga444444-4444-4444-4444-444444444444', 'Music Education')
ON CONFLICT (id) DO NOTHING;

-- Périodes académiques
INSERT INTO academic_periods (id, academic_year, type, name, number, start_date, end_date, parent_id)
VALUES
  -- Séquences
  ('p1111111-1111-1111-1111-111111111111', '2024-2025', 'sequence', 'Séquence 1', 1, '2024-09-02', '2024-10-25', NULL),
  ('p2222222-2222-2222-2222-222222222222', '2024-2025', 'sequence', 'Séquence 2', 2, '2024-10-28', '2024-12-20', NULL),
  ('p3333333-3333-3333-3333-333333333333', '2024-2025', 'sequence', 'Séquence 3', 3, '2025-01-06', '2025-02-28', NULL),
  ('p4444444-4444-4444-4444-444444444444', '2024-2025', 'sequence', 'Séquence 4', 4, '2025-03-03', '2025-04-11', NULL),
  ('p5555555-5555-5555-5555-555555555555', '2024-2025', 'sequence', 'Séquence 5', 5, '2025-04-28', '2025-05-30', NULL),
  ('p6666666-6666-6666-6666-666666666666', '2024-2025', 'sequence', 'Séquence 6', 6, '2025-06-02', '2025-06-30', NULL)
ON CONFLICT (id) DO NOTHING;

-- Trimestres (liés aux séquences)
INSERT INTO academic_periods (id, academic_year, type, name, number, start_date, end_date, parent_id)
VALUES
  ('t1111111-1111-1111-1111-111111111111', '2024-2025', 'trimester', 'Trimestre 1', 1, '2024-09-02', '2024-12-20', NULL),
  ('t2222222-2222-2222-2222-222222222222', '2024-2025', 'trimester', 'Trimestre 2', 2, '2025-01-06', '2025-04-11', NULL),
  ('t3333333-3333-3333-3333-333333333333', '2024-2025', 'trimester', 'Trimestre 3', 3, '2025-04-28', '2025-06-30', NULL)
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour les séquences avec leur parent trimestre
UPDATE academic_periods SET parent_id = 't1111111-1111-1111-1111-111111111111' WHERE id IN ('p1111111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222');
UPDATE academic_periods SET parent_id = 't2222222-2222-2222-2222-222222222222' WHERE id IN ('p3333333-3333-3333-3333-333333333333', 'p4444444-4444-4444-4444-444444444444');
UPDATE academic_periods SET parent_id = 't3333333-3333-3333-3333-333333333333' WHERE id IN ('p5555555-5555-5555-5555-555555555555', 'p6666666-6666-6666-6666-666666666666');

-- Année académique
INSERT INTO academic_periods (id, academic_year, type, name, number, start_date, end_date, parent_id)
VALUES
  ('y1111111-1111-1111-1111-111111111111', '2024-2025', 'year', 'Année 2024-2025', 1, '2024-09-02', '2025-06-30', NULL)
ON CONFLICT (id) DO NOTHING;

-- Paramètres de l'école
INSERT INTO school_settings (id, school_name, school_slogan, current_academic_year, grading_scale, address, phone, email)
VALUES (
  'set11111-1111-1111-1111-111111111111',
  'Collège HARMONY',
  'L''harmonie entre technologie et éducation',
  '2024-2025',
  20,
  'Yaoundé, Cameroun',
  '+237 6XX XXX XXX',
  'contact@harmony.edu'
)
ON CONFLICT (id) DO UPDATE SET 
  school_name = EXCLUDED.school_name,
  school_slogan = EXCLUDED.school_slogan;
