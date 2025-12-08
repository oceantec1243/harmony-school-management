-- =====================================================
-- SCRIPT: Nettoyer les enseignants et insérer les matières
-- =====================================================

-- =====================================================
-- PARTIE 1: SUPPRIMER LES ENSEIGNANTS EN DOUBLON
-- =====================================================

DELETE FROM teachers
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY LOWER(TRIM(first_name || ' ' || last_name))
                   ORDER BY created_at ASC
               ) AS rn
        FROM teachers
    ) t
    WHERE rn > 1
);

-- =====================================================
-- PARTIE 2: CRÉER/VÉRIFIER LES SECTIONS
-- =====================================================

INSERT INTO sections (id, name, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Francophone', 'Section Francophone'),
    ('22222222-2222-2222-2222-222222222222', 'Anglophone', 'Section Anglophone')
ON CONFLICT (name) DO NOTHING;

-- Get actual section IDs
DO $$
DECLARE
    v_francophone_id UUID;
    v_anglophone_id UUID;
BEGIN
    SELECT id INTO v_francophone_id FROM sections WHERE name = 'Francophone' LIMIT 1;
    SELECT id INTO v_anglophone_id FROM sections WHERE name = 'Anglophone' LIMIT 1;
    
    CREATE TEMP TABLE IF NOT EXISTS section_ids (
        name TEXT PRIMARY KEY,
        id UUID
    );
    DELETE FROM section_ids;
    INSERT INTO section_ids VALUES ('Francophone', v_francophone_id), ('Anglophone', v_anglophone_id);
END $$;

-- =====================================================
-- PARTIE 3: CRÉER LES GROUPES DE MATIÈRES
-- =====================================================

DELETE FROM subjects;
DELETE FROM subject_groups;

-- Groupes pour Francophone
INSERT INTO subject_groups (name, section_id, "order")
SELECT 'Groupe 1 - Matières Scientifiques', id, 1 FROM section_ids WHERE name = 'Francophone'
UNION ALL
SELECT 'Groupe 2 - Matières Littéraires', id, 2 FROM section_ids WHERE name = 'Francophone'
UNION ALL
SELECT 'Groupe 3 - Matières Supplémentaires', id, 3 FROM section_ids WHERE name = 'Francophone'
UNION ALL
SELECT 'Groupe 4 - Matières Professionnelles', id, 4 FROM section_ids WHERE name = 'Francophone';

-- Groupes pour Anglophone
INSERT INTO subject_groups (name, section_id, "order")
SELECT 'Group 1 - Scientific Subjects', id, 1 FROM section_ids WHERE name = 'Anglophone'
UNION ALL
SELECT 'Group 2 - Literary Subjects', id, 2 FROM section_ids WHERE name = 'Anglophone'
UNION ALL
SELECT 'Group 3 - Social Sciences', id, 3 FROM section_ids WHERE name = 'Anglophone'
UNION ALL
SELECT 'Group 4 - Professional Subjects', id, 4 FROM section_ids WHERE name = 'Anglophone';

-- =====================================================
-- PARTIE 4: INSÉRER LES MATIÈRES FRANCOPHONES
-- Ajout du préfixe FR- pour éviter les doublons de codes
-- =====================================================

-- Groupe 1 - Matières Scientifiques (Francophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Francophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('BIOLOGIE', 'FR-BIO', 'Sciences de la vie'),
    ('BIOLOGIE HUMAINE', 'FR-HBIO', 'Étude du corps humain'),
    ('INFORMATIQUE', 'FR-INFO', 'Sciences informatiques'),
    ('MATHEMATIQUES ADDITIONEL', 'FR-AMATH', 'Mathématiques avancées')
) AS sub(name, code, description)
WHERE sg.name = 'Groupe 1 - Matières Scientifiques';

-- Groupe 2 - Matières Littéraires (Francophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Francophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('FRANCAIS', 'FR-FRE', 'Langue française'),
    ('LITTERATURE', 'FR-LIT', 'Littérature française')
) AS sub(name, code, description)
WHERE sg.name = 'Groupe 2 - Matières Littéraires';

-- Groupe 3 - Matières Supplémentaires (Francophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Francophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('ECONOMIE', 'FR-ECON', 'Sciences économiques'),
    ('ECONOMIE SOCIALE ET FAMILIALE', 'FR-ESF', 'Économie sociale et familiale'),
    ('EDUCATION PHYSIQUE ET SPORTIVE', 'FR-EPS', 'Sports et activités physiques'),
    ('TRAVAIL MANUEL', 'FR-TM', 'Travaux manuels')
) AS sub(name, code, description)
WHERE sg.name = 'Groupe 3 - Matières Supplémentaires';

-- Groupe 4 - Matières Professionnelles (Francophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Francophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('ADMINISTRATION DU BUREAU', 'FR-OA', 'Gestion administrative'),
    ('COMMERCE', 'FR-COM', 'Commerce'),
    ('COMMERCE ET FORMATION', 'FR-TT', 'Commerce et formation'),
    ('COMPTABILITÉ', 'FR-ACC', 'Comptabilité'),
    ('CONNAISSANCE DE L''OUTILLAGE', 'FR-CONO', 'Connaissance des outils'),
    ('CONNAISSANCE DES MATERIAUX', 'FR-CM', 'Étude des matériaux'),
    ('COUPE', 'FR-CP', 'Techniques de coupe'),
    ('COUTURE', 'FR-CT', 'Couture'),
    ('DESSIN DE MODE', 'FR-DM', 'Design de mode'),
    ('DESSIN TECHNIQUE', 'FR-DT', 'Dessin technique'),
    ('DEVIS ET ESTIMATION', 'FR-DE', 'Devis et estimation'),
    ('EDUCATION ARTISTIQUE ET DECORATIVE', 'FR-EAD', 'Arts décoratifs'),
    ('GESTION SUR ORDINATEUR', 'FR-GSO', 'Gestion informatique'),
    ('HYGIÈNE', 'FR-HYG', 'Hygiène'),
    ('LEGISLATION', 'FR-LAW', 'Droit et législation'),
    ('LEGISLATION DU TRAVAIL', 'FR-LEGIS', 'Droit du travail'),
    ('MARKETING', 'FR-MAK', 'Marketing'),
    ('MÉTIERS ET FORMATION', 'FR-MF', 'Formation professionnelle'),
    ('NUTRITION', 'FR-NUT', 'Nutrition'),
    ('PÉRICULTURE, GÉRONTOLÓGIE ET DIÉTÉTIQUE', 'FR-PGD', 'Puériculture, gérontologie et diététique'),
    ('RESSOURCES HUMAINES', 'FR-HR', 'Gestion des ressources humaines'),
    ('SANTÉ, SÉCURITÉ ET ENVIRONNEMENT', 'FR-HSE', 'HSE'),
    ('SCIENCES DES ÉQUIPEMENTS ET DU LOGEMENT', 'FR-SEL', 'Équipements et logement'),
    ('SCIENCES DE L''INGÉNIERIE', 'FR-ESC', 'Ingénierie'),
    ('SCIENCES NATUREL', 'FR-NS', 'Sciences naturelles'),
    ('TECHNIQUE CULINAIRE', 'FR-TECHCU', 'Arts culinaires'),
    ('TECHNOLOGIE', 'FR-TECH', 'Technologie'),
    ('TECHNOLOGIE DES MATERIAUX', 'FR-MT', 'Technologie des matériaux'),
    ('TECHNOLOGIE PROFESSIONNELLE', 'FR-TC', 'Technologie professionnelle'),
    ('TRAVAUX PRATIQUES', 'FR-TP', 'Travaux pratiques'),
    ('VIE DE FAMILLE', 'FR-FL', 'Vie familiale')
) AS sub(name, code, description)
WHERE sg.name = 'Groupe 4 - Matières Professionnelles';

-- =====================================================
-- PARTIE 5: INSÉRER LES MATIÈRES ANGLOPHONES
-- Ajout du préfixe EN- pour éviter les doublons de codes
-- =====================================================

-- Group 1 - Scientific Subjects (Anglophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Anglophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('BIOLOGY', 'EN-BIO', 'Life sciences'),
    ('HUMAN BIOLOGY', 'EN-HBIO', 'Study of human body'),
    ('COMPUTER SCIENCE', 'EN-COMP', 'Computer sciences'),
    ('ADDITIONAL MATHEMATICS', 'EN-AMATH', 'Advanced mathematics')
) AS sub(name, code, description)
WHERE sg.name = 'Group 1 - Scientific Subjects';

-- Group 2 - Literary Subjects (Anglophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Anglophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('FRENCH', 'EN-FRE', 'French language'),
    ('LITERATURE IN ENGLISH', 'EN-LIT', 'English literature')
) AS sub(name, code, description)
WHERE sg.name = 'Group 2 - Literary Subjects';

-- Group 3 - Social Sciences (Anglophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Anglophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('ECONOMICS', 'EN-ECON', 'Economic sciences'),
    ('SOCIAL AND FAMILY ECONOMICS', 'EN-ESF', 'Social and family economics'),
    ('SPORTS', 'EN-EPS', 'Physical education'),
    ('MANUAL LABOR', 'EN-TM', 'Manual work')
) AS sub(name, code, description)
WHERE sg.name = 'Group 3 - Social Sciences';

-- Group 4 - Professional Subjects (Anglophone)
INSERT INTO subjects (name, code, subject_group_id, section_id, description)
SELECT sub.name, sub.code, sg.id, si.id, sub.description
FROM subject_groups sg
JOIN section_ids si ON si.name = 'Anglophone' AND sg.section_id = si.id
CROSS JOIN (VALUES
    ('OFFICE ADMINISTRATION', 'EN-OA', 'Administrative management'),
    ('COMMERCE', 'EN-COM', 'Commerce'),
    ('TRADE AND TRAINING', 'EN-TT', 'Trade and training'),
    ('ACCOUNTING', 'EN-ACC', 'Accounting'),
    ('KNOWLEDGE OF TOOLS', 'EN-CONO', 'Tool knowledge'),
    ('MATERIALS', 'EN-CM', 'Study of materials'),
    ('CUTTING', 'EN-CP', 'Cutting techniques'),
    ('SEWING', 'EN-CT', 'Sewing'),
    ('FASHION DESIGN', 'EN-DM', 'Fashion design'),
    ('TECHNICAL DRAWING', 'EN-DT', 'Technical drawing'),
    ('QUANTITY AND ESTIMATES', 'EN-QE', 'Quantity and estimates'),
    ('ART AND DECORATIVE ARTS EDUCATION', 'EN-ADE', 'Decorative arts'),
    ('MANAGEMENT ON COMPUTER', 'EN-GSO', 'Computer management'),
    ('HYGIENE', 'EN-HYG', 'Hygiene'),
    ('LAW AND LEGISLATION', 'EN-LAW', 'Law and legislation'),
    ('LABOR LEGISLATION', 'EN-LEGIS', 'Labor law'),
    ('MARKETING', 'EN-MAK', 'Marketing'),
    ('PROFESSION AND TRAINING', 'EN-MF', 'Professional training'),
    ('FOOD AND NUTRITION', 'EN-FN', 'Food and nutrition'),
    ('CHILDCARE, GERONTOLOGY, AND DIETETICS', 'EN-PGD', 'Childcare, gerontology and dietetics'),
    ('HUMAN RESOURCE', 'EN-HR', 'Human resource management'),
    ('HEALTH SAFETY AND ENVIRONMENT', 'EN-HSE', 'HSE'),
    ('EQUIPMENT AND HOUSING SCIENCES', 'EN-SEL', 'Equipment and housing'),
    ('ENGINEERING SCIENCE', 'EN-ESC', 'Engineering'),
    ('NATURAL SCIENCE', 'EN-NS', 'Natural sciences'),
    ('CULINARY TECHNIQUE', 'EN-TECHCU', 'Culinary arts'),
    ('TECHNOLOGY', 'EN-TECH', 'Technology'),
    ('MATERIALS TECHNOLOGY', 'EN-MT', 'Materials technology'),
    ('PROFESSIONAL TECHNOLOGY', 'EN-PT', 'Professional technology'),
    ('PRACTICAL WORK', 'EN-TP', 'Practical work'),
    ('FAMILY LIFE', 'EN-FL', 'Family life')
) AS sub(name, code, description)
WHERE sg.name = 'Group 4 - Professional Subjects';

-- Drop temp table
DROP TABLE IF EXISTS section_ids;

-- =====================================================
-- AFFICHER LE RÉCAPITULATIF
-- =====================================================

SELECT 
    s.name AS section,
    sg.name AS groupe,
    COUNT(sub.id) AS nombre_matieres
FROM sections s
JOIN subject_groups sg ON sg.section_id = s.id
LEFT JOIN subjects sub ON sub.subject_group_id = sg.id
GROUP BY s.name, sg.name, sg."order"
ORDER BY s.name, sg."order";
