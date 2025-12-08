-- Script d'insertion des attributions de matières aux classes
-- Ce script utilise les noms des matières et enseignants pour trouver les IDs dynamiquement

-- Remplacer TRUNCATE par DELETE pour éviter l'erreur de contrainte FK
-- D'abord, vider la table class_subjects pour éviter les doublons
DELETE FROM class_subjects;

-- =====================================================
-- CLASSES FRANCOPHONES
-- =====================================================

-- 6ème (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('6eme', 'ANGLAIS', 'BRANDON', 'CHE', 1),
  ('6eme', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('6eme', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('6eme', 'ECONOMIE SOCIALE ET FAMILIALE', 'ELVINE', 'NONO', 1),
  ('6eme', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('6eme', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('6eme', 'ESPAGNOL', 'ELIANE', 'DJUIDJEU', 1),
  ('6eme', 'FRANCAIS', 'HARLAND', 'MBIDA', 1),
  ('6eme', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('6eme', 'HISTOIRE', 'HARLAND', 'MBIDA', 1),
  ('6eme', 'INFORMATIQUE', 'ETIENNE', 'EFFILA', 2),
  ('6eme', 'LANGUE ET CULTURE NATIONALE', 'DIANE', 'AVOMO', 2),
  ('6eme', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 2),
  ('6eme', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('6eme', 'SCIENCES DE LA VIE ET DE LA TERRE', 'ZE', 'MBALLA', 3),
  ('6eme', 'TRAVAIL MANUEL', 'DIANE', 'AVOMO', 2),
  ('6eme', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON UPPER(c.name) = UPPER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 5ème (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('5eme', 'ANGLAIS', 'BRANDON', 'CHE', 1),
  ('5eme', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('5eme', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('5eme', 'ECONOMIE SOCIALE ET FAMILIALE', 'ELVINE', 'NONO', 1),
  ('5eme', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('5eme', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('5eme', 'ESPAGNOL', 'ELIANE', 'DJUIDJEU', 1),
  ('5eme', 'FRANCAIS', 'HARLAND', 'MBIDA', 1),
  ('5eme', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('5eme', 'HISTOIRE', 'HARLAND', 'MBIDA', 1),
  ('5eme', 'INFORMATIQUE', 'ETIENNE', 'EFFILA', 2),
  ('5eme', 'LANGUE ET CULTURE NATIONALE', 'DIANE', 'AVOMO', 2),
  ('5eme', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 2),
  ('5eme', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('5eme', 'SCIENCES DE LA VIE ET DE LA TERRE', 'ZE', 'MBALLA', 3),
  ('5eme', 'TRAVAIL MANUEL', 'DIANE', 'AVOMO', 2),
  ('5eme', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON UPPER(c.name) = UPPER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 4ème (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('4eme', 'ANGLAIS', 'BRANDON', 'CHE', 2),
  ('4eme', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('4eme', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('4eme', 'ECONOMIE SOCIALE ET FAMILIALE', 'ELVINE', 'NONO', 1),
  ('4eme', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('4eme', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('4eme', 'ESPAGNOL', 'ELIANE', 'DJUIDJEU', 2),
  ('4eme', 'FRANCAIS', 'HARLAND', 'MBIDA', 2),
  ('4eme', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('4eme', 'HISTOIRE', 'HARLAND', 'MBIDA', 2),
  ('4eme', 'INFORMATIQUE', 'ETIENNE', 'EFFILA', 2),
  ('4eme', 'LANGUE ET CULTURE NATIONALE', 'DIANE', 'AVOMO', 2),
  ('4eme', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 4),
  ('4eme', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('4eme', 'SCIENCES DE LA VIE ET DE LA TERRE', 'ZE', 'MBALLA', 3),
  ('4eme', 'TRAVAIL MANUEL', 'DIANE', 'AVOMO', 1),
  ('4eme', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON UPPER(c.name) = UPPER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 3ème (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('3eme', 'ANGLAIS', 'BRANDON', 'CHE', 2),
  ('3eme', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('3eme', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('3eme', 'ECONOMIE SOCIALE ET FAMILIALE', 'ELVINE', 'NONO', 1),
  ('3eme', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('3eme', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('3eme', 'ESPAGNOL', 'ELIANE', 'DJUIDJEU', 2),
  ('3eme', 'FRANCAIS', 'HARLAND', 'MBIDA', 3),
  ('3eme', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('3eme', 'HISTOIRE', 'HARLAND', 'MBIDA', 2),
  ('3eme', 'INFORMATIQUE', 'ETIENNE', 'EFFILA', 2),
  ('3eme', 'LANGUE ET CULTURE NATIONALE', 'DIANE', 'AVOMO', 2),
  ('3eme', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 4),
  ('3eme', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('3eme', 'SCIENCES DE LA VIE ET DE LA TERRE', 'ZE', 'MBALLA', 3),
  ('3eme', 'TRAVAIL MANUEL', 'DIANE', 'AVOMO', 1),
  ('3eme', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON UPPER(c.name) = UPPER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 1ère année ESF (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('1ere année esf', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('1ere année esf', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('1ere année esf', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('1ere année esf', 'ECONOMIE SOCIALE ET FAMILIALE', 'ELVINE', 'NONO', 3),
  ('1ere année esf', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('1ere année esf', 'FRANCAIS', 'HARLAND', 'MBIDA', 1),
  ('1ere année esf', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('1ere année esf', 'HISTOIRE', 'HARLAND', 'MBIDA', 1),
  ('1ere année esf', 'LANGUE ET CULTURE NATIONALE', 'DIANE', 'AVOMO', 2),
  ('1ere année esf', 'ANGLAIS', 'DIANE', 'AVOMO', 1),
  ('1ere année esf', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 2),
  ('1ere année esf', 'HYGIENE', 'DIANE', 'AVOMO', 1),
  ('1ere année esf', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('1ere année esf', 'PUÉRICULTURE, GÉRONTOLOGIE ET DIÉTÉTIQUE', 'ELVINE', 'NONO', 1),
  ('1ere année esf', 'SCIENCE DE L''ÉQUIPEMENT ET LOGEMENT', 'ELVINE', 'NONO', 4),
  ('1ere année esf', 'TECHNIQUE CULINAIRE', 'ELVINE', 'NONO', 4),
  ('1ere année esf', 'ALIMENTATION ET NUTRITION', 'ELVINE', 'NONO', 4),
  ('1ere année esf', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 1ère année Comé (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('1ere année comé', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('1ere année comé', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('1ere année comé', 'COMMERCE', 'POUMA', 'NGO', 3),
  ('1ere année comé', 'COMPTABILITÉ', 'POUMA', 'NGO', 5),
  ('1ere année comé', 'DROIT', 'POUMA', 'NGO', 2),
  ('1ere année comé', 'ECONOMIE', 'POUMA', 'NGO', 2),
  ('1ere année comé', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('1ere année comé', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('1ere année comé', 'FRANCAIS', 'HARLAND', 'MBIDA', 1),
  ('1ere année comé', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('1ere année comé', 'HISTOIRE', 'HARLAND', 'MBIDA', 1),
  ('1ere année comé', 'INFORMATIQUE', 'ETIENNE', 'EFFILA', 2),
  ('1ere année comé', 'ANGLAIS', 'DIANE', 'AVOMO', 1),
  ('1ere année comé', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 2),
  ('1ere année comé', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('1ere année comé', 'MARKETING', 'POUMA', 'NGO', 1),
  ('1ere année comé', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 1ère année ELEC (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('1ere année elec', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('1ere année elec', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('1ere année elec', 'ECONOMIE', 'PHILIPPE', 'NGUMU', 4),
  ('1ere année elec', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('1ere année elec', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('1ere année elec', 'FRANCAIS', 'HARLAND', 'MBIDA', 1),
  ('1ere année elec', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('1ere année elec', 'HISTOIRE', 'HARLAND', 'MBIDA', 1),
  ('1ere année elec', 'ANGLAIS', 'DIANE', 'AVOMO', 1),
  ('1ere année elec', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 2),
  ('1ere année elec', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('1ere année elec', 'DESSIN TECHNIQUE', 'PHILIPPE', 'NGUMU', 1),
  ('1ere année elec', 'TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('1ere année elec', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1),
  ('1ere année elec', 'TRAVAUX PRATIQUES', 'PHILIPPE', 'NGUMU', 1)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- 1ère année MENU/MACO (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('1ere année ménu/maco', 'BIOLOGIE', 'GERALDINE', 'EBAMU', 3),
  ('1ere année ménu/maco', 'DESSIN', 'HARLAND', 'MBIDA', 1),
  ('1ere année ménu/maco', 'ECONOMIE', 'PHILIPPE', 'NGUMU', 4),
  ('1ere année ménu/maco', 'EDUCATION CIVIQUE ET MORALE', 'DIANE', 'AVOMO', 2),
  ('1ere année ménu/maco', 'EDUCATION PHYSIQUE ET SPORTIVE', 'ADEBO', 'PLATINI', 2),
  ('1ere année ménu/maco', 'FRANCAIS', 'HARLAND', 'MBIDA', 1),
  ('1ere année ménu/maco', 'GEOGRAPHIE', 'HARLAND', 'MBIDA', 2),
  ('1ere année ménu/maco', 'HISTOIRE', 'HARLAND', 'MBIDA', 1),
  ('1ere année ménu/maco', 'LANGUE ET CULTURE NATIONALE', 'DIANE', 'AVOMO', 2),
  ('1ere année ménu/maco', 'MATHEMATIQUES', 'NESTOR', 'TOUKEA', 2),
  ('1ere année ménu/maco', 'PHYSIQUE CHIMIE TECHNOLOGIE', 'ZE', 'MBALLA', 4),
  ('1ere année ménu/maco', 'DESSIN TECHNIQUE', 'PHILIPPE', 'NGUMU', 1),
  ('1ere année ménu/maco', 'TECHNOLOGIE', 'PHILIPPE', 'NGUMU', 3),
  ('1ere année ménu/maco', 'MECANIQUE', 'PHILIPPE', 'NGUMU', 3),
  ('1ere année ménu/maco', 'MUSIQUE', 'MELENGUE', 'SANGONG', 1),
  ('1ere année ménu/maco', 'TRAVAUX PRATIQUES', 'PHILIPPE', 'NGUMU', 4)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- =====================================================
-- CLASSES ANGLOPHONES
-- =====================================================

-- Form 1 BC (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 1 BC', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 1 BC', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 1 BC', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 1 BC', 'ENGINEERING SCIENCE', 'PHILIPPE', 'NGUMU', 4),
  ('Form 1 BC', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 1 BC', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 1 BC', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 1 BC', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 1 BC', 'SPORTS', 'ADEBO', 'PLATINI', 2),
  ('Form 1 BC', 'TECHNICAL DRAWING', 'PHILIPPE', 'NGUMU', 2),
  ('Form 1 BC', 'TECHNOLOGY', 'PHILIPPE', 'NGUMU', 1),
  ('Form 1 BC', 'PRACTICAL WORK', 'PHILIPPE', 'NGUMU', 4)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 1 CA (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 1 CA', 'ACCOUNTING', 'FRANKINE', 'FRANKINE', 4),
  ('Form 1 CA', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 1 CA', 'COMMERCE', 'FRANKINE', 'FRANKINE', 4),
  ('Form 1 CA', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 1 CA', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 1 CA', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 1 CA', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 1 CA', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 1 CA', 'LAW AND LEGISLATION', 'FRANKINE', 'FRANKINE', 2),
  ('Form 1 CA', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 1 CA', 'MARKETING', 'FRANKINE', 'FRANKINE', 2),
  ('Form 1 CA', 'OFFICE ADMINISTRATION', 'PAMOLINE', 'NGENUE', 1),
  ('Form 1 CA', 'SPORTS', 'ADEBO', 'PLATINI', 2)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 1 DH (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 1 DH', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 1 DH', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 1 DH', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 1 DH', 'SOCIAL AND FAMILY ECONOMICS', 'CHARLOT', 'BUMA', 2),
  ('Form 1 DH', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 4),
  ('Form 1 DH', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 1 DH', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 1 DH', 'HYGIENE', 'CHARLOT', 'BUMA', 2),
  ('Form 1 DH', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 1 DH', 'EQUIPMENT AND HOUSING SCIENCES', 'CHARLOT', 'BUMA', 3),
  ('Form 1 DH', 'SPORTS', 'ADEBO', 'PLATINI', 2),
  ('Form 1 DH', 'CHILDCARE, GERONTOLOGY, AND DIETETICS', 'CHARLOT', 'BUMA', 2)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 1 EE (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 1 EE', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 1 EE', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 1 EE', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 1 EE', 'ENGINEERING SCIENCE', 'PHILIPPE', 'NGUMU', 4),
  ('Form 1 EE', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 1 EE', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 1 EE', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 1 EE', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 1 EE', 'SPORTS', 'ADEBO', 'PLATINI', 2),
  ('Form 1 EE', 'TECHNICAL DRAWING', 'PHILIPPE', 'NGUMU', 2),
  ('Form 1 EE', 'TECHNOLOGY', 'PHILIPPE', 'NGUMU', 1),
  ('Form 1 EE', 'PRACTICAL WORK', 'PHILIPPE', 'NGUMU', 4)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 1 GT (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 1 GT', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 1 GT', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 1 GT', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 1 GT', 'SOCIAL AND FAMILY ECONOMICS', 'KERRY', 'CYNDY', 4),
  ('Form 1 GT', 'FASHION DESIGN', 'KERRY', 'CYNDY', 2),
  ('Form 1 GT', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 1 GT', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 1 GT', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 1 GT', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 1 GT', 'CUTTING', 'KERRY', 'CYNDY', 3),
  ('Form 1 GT', 'SEWING', 'KERRY', 'CYNDY', 4),
  ('Form 1 GT', 'SPORTS', 'ADEBO', 'PLATINI', 2)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 2 GT (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 2 GT', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 2 GT', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 2 GT', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 2 GT', 'SOCIAL AND FAMILY ECONOMICS', 'KERRY', 'CYNDY', 4),
  ('Form 2 GT', 'FASHION DESIGN', 'KERRY', 'CYNDY', 2),
  ('Form 2 GT', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 2 GT', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 2 GT', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 2 GT', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 2 GT', 'CUTTING', 'KERRY', 'CYNDY', 3),
  ('Form 2 GT', 'SEWING', 'KERRY', 'CYNDY', 4),
  ('Form 2 GT', 'SPORTS', 'ADEBO', 'PLATINI', 2)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 2 DH (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 2 DH', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 2 DH', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 2 DH', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 2 DH', 'SOCIAL AND FAMILY ECONOMICS', 'CHARLOT', 'BUMA', 2),
  ('Form 2 DH', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 4),
  ('Form 2 DH', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 2 DH', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 2 DH', 'HYGIENE', 'CHARLOT', 'BUMA', 2),
  ('Form 2 DH', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 2 DH', 'EQUIPMENT AND HOUSING SCIENCES', 'CHARLOT', 'BUMA', 3),
  ('Form 2 DH', 'SPORTS', 'ADEBO', 'PLATINI', 2),
  ('Form 2 DH', 'CHILDCARE, GERONTOLOGY, AND DIETETICS', 'CHARLOT', 'BUMA', 2)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 2 CA (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 2 CA', 'ACCOUNTING', 'FRANKINE', 'FRANKINE', 4),
  ('Form 2 CA', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 2 CA', 'COMMERCE', 'FRANKINE', 'FRANKINE', 4),
  ('Form 2 CA', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 2 CA', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 2 CA', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 2 CA', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 2 CA', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 2 CA', 'LAW AND LEGISLATION', 'FRANKINE', 'FRANKINE', 2),
  ('Form 2 CA', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 2 CA', 'MARKETING', 'FRANKINE', 'FRANKINE', 2),
  ('Form 2 CA', 'OFFICE ADMINISTRATION', 'PAMOLINE', 'NGENUE', 1),
  ('Form 2 CA', 'SPORTS', 'ADEBO', 'PLATINI', 2)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 2 EE (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 2 EE', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 2 EE', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 2 EE', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 2 EE', 'ENGINEERING SCIENCE', 'PHILIPPE', 'NGUMU', 4),
  ('Form 2 EE', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 2 EE', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 2 EE', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 2 EE', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 2 EE', 'SPORTS', 'ADEBO', 'PLATINI', 2),
  ('Form 2 EE', 'TECHNICAL DRAWING', 'PHILIPPE', 'NGUMU', 2),
  ('Form 2 EE', 'TECHNOLOGY', 'PHILIPPE', 'NGUMU', 1),
  ('Form 2 EE', 'PRACTICAL WORK', 'PHILIPPE', 'NGUMU', 4)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Form 2 BC (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient)
SELECT 
  c.id,
  s.id,
  t.id,
  v.coefficient
FROM (VALUES
  ('Form 2 BC', 'BIOLOGY', 'ALTESS', 'OBIYIHA', 1),
  ('Form 2 BC', 'COMPUTER SCIENCE', 'GAMALIEL', 'SOP', 1),
  ('Form 2 BC', 'ECONOMICS', 'BRANDON', 'CHE', 1),
  ('Form 2 BC', 'ENGINEERING SCIENCE', 'PHILIPPE', 'NGUMU', 4),
  ('Form 2 BC', 'FOOD AND NUTRITION', 'CHARLOT', 'BUMA', 2),
  ('Form 2 BC', 'FRENCH', 'THIERRIEL', 'FONYA', 3),
  ('Form 2 BC', 'HUMAN BIOLOGY', 'GOTHARD', 'MIFOUMA', 1),
  ('Form 2 BC', 'LITERATURE IN ENGLISH', 'EMELDA', 'BUTOH', 2),
  ('Form 2 BC', 'SPORTS', 'ADEBO', 'PLATINI', 2),
  ('Form 2 BC', 'TECHNICAL DRAWING', 'PHILIPPE', 'NGUMU', 2),
  ('Form 2 BC', 'TECHNOLOGY', 'PHILIPPE', 'NGUMU', 1),
  ('Form 2 BC', 'PRACTICAL WORK', 'PHILIPPE', 'NGUMU', 4)
) AS v(class_name, subject_name, teacher_first, teacher_last, coefficient)
JOIN classes c ON LOWER(c.name) = LOWER(v.class_name)
JOIN subjects s ON UPPER(s.name) = UPPER(v.subject_name)
LEFT JOIN teachers t ON UPPER(t.first_name) LIKE '%' || UPPER(v.teacher_first) || '%' 
                     AND UPPER(t.last_name) LIKE '%' || UPPER(v.teacher_last) || '%'
ON CONFLICT (class_id, subject_id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  coefficient = EXCLUDED.coefficient;

-- Afficher le résumé des attributions
SELECT 
  c.name AS class_name,
  COUNT(*) AS subject_count
FROM class_subjects cs
JOIN classes c ON cs.class_id = c.id
GROUP BY c.name
ORDER BY c.name;
