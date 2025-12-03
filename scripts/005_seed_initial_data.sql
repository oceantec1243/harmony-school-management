-- Insert Sections
INSERT INTO sections (id, name, description) VALUES
  ('sec-fr', 'Francophone', 'Section francophone'),
  ('sec-en', 'Anglophone', 'Section anglophone')
ON CONFLICT (id) DO NOTHING;

-- Insert Subject Groups
INSERT INTO subject_groups (id, name, "order") VALUES
  ('grp-1', 'Groupe I - Langues', 1),
  ('grp-2', 'Groupe II - Sciences', 2),
  ('grp-3', 'Groupe III - Sciences Humaines', 3),
  ('grp-4', 'Groupe IV - Autres', 4)
ON CONFLICT (id) DO NOTHING;

-- Insert Levels for Francophone Section
INSERT INTO levels (id, name, section_id, "order") VALUES
  ('lvl-6eme', '6ème', 'sec-fr', 1),
  ('lvl-5eme', '5ème', 'sec-fr', 2),
  ('lvl-4eme', '4ème', 'sec-fr', 3),
  ('lvl-3eme', '3ème', 'sec-fr', 4),
  ('lvl-2nde', '2nde', 'sec-fr', 5),
  ('lvl-1ere', '1ère', 'sec-fr', 6),
  ('lvl-tle', 'Terminale', 'sec-fr', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert Levels for Anglophone Section
INSERT INTO levels (id, name, section_id, "order") VALUES
  ('lvl-form1', 'Form 1', 'sec-en', 1),
  ('lvl-form2', 'Form 2', 'sec-en', 2),
  ('lvl-form3', 'Form 3', 'sec-en', 3),
  ('lvl-form4', 'Form 4', 'sec-en', 4),
  ('lvl-form5', 'Form 5', 'sec-en', 5),
  ('lvl-ls1', 'Lower Sixth', 'sec-en', 6),
  ('lvl-us1', 'Upper Sixth', 'sec-en', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert Common Subjects
INSERT INTO subjects (id, name, code, subject_group_id, description) VALUES
  ('sub-fr', 'Français', 'FR', 'grp-1', 'Langue française'),
  ('sub-en', 'Anglais', 'EN', 'grp-1', 'Langue anglaise'),
  ('sub-math', 'Mathématiques', 'MATH', 'grp-2', 'Mathématiques générales'),
  ('sub-phys', 'Physique', 'PHYS', 'grp-2', 'Physique'),
  ('sub-chim', 'Chimie', 'CHIM', 'grp-2', 'Chimie'),
  ('sub-svt', 'SVT', 'SVT', 'grp-2', 'Sciences de la Vie et de la Terre'),
  ('sub-hist', 'Histoire', 'HIST', 'grp-3', 'Histoire'),
  ('sub-geo', 'Géographie', 'GEO', 'grp-3', 'Géographie'),
  ('sub-ecm', 'ECM', 'ECM', 'grp-3', 'Education Civique et Morale'),
  ('sub-philo', 'Philosophie', 'PHILO', 'grp-3', 'Philosophie'),
  ('sub-eps', 'EPS', 'EPS', 'grp-4', 'Education Physique et Sportive'),
  ('sub-info', 'Informatique', 'INFO', 'grp-4', 'Informatique')
ON CONFLICT (id) DO NOTHING;

-- Insert Academic Periods for 2024-2025
INSERT INTO academic_periods (id, name, type, academic_year, "number", start_date, end_date, parent_id) VALUES
  -- Trimestres
  ('per-t1', 'Trimestre 1', 'trimester', '2024-2025', 1, '2024-09-02', '2024-12-15', NULL),
  ('per-t2', 'Trimestre 2', 'trimester', '2024-2025', 2, '2025-01-06', '2025-03-30', NULL),
  ('per-t3', 'Trimestre 3', 'trimester', '2024-2025', 3, '2025-04-14', '2025-06-30', NULL),
  -- Séquences du Trimestre 1
  ('per-s1', 'Séquence 1', 'sequence', '2024-2025', 1, '2024-09-02', '2024-10-25', 'per-t1'),
  ('per-s2', 'Séquence 2', 'sequence', '2024-2025', 2, '2024-10-28', '2024-12-15', 'per-t1'),
  -- Séquences du Trimestre 2
  ('per-s3', 'Séquence 3', 'sequence', '2024-2025', 3, '2025-01-06', '2025-02-15', 'per-t2'),
  ('per-s4', 'Séquence 4', 'sequence', '2024-2025', 4, '2025-02-17', '2025-03-30', 'per-t2'),
  -- Séquences du Trimestre 3
  ('per-s5', 'Séquence 5', 'sequence', '2024-2025', 5, '2025-04-14', '2025-05-25', 'per-t3'),
  ('per-s6', 'Séquence 6', 'sequence', '2024-2025', 6, '2025-05-26', '2025-06-30', 'per-t3'),
  -- Année complète
  ('per-year', 'Année 2024-2025', 'year', '2024-2025', 1, '2024-09-02', '2025-06-30', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert default school settings
INSERT INTO school_settings (id, school_name, school_slogan, current_academic_year, grading_scale) VALUES
  ('settings-1', 'HARMONY School', 'L''harmonie entre technologie et éducation', '2024-2025', 20)
ON CONFLICT (id) DO NOTHING;
