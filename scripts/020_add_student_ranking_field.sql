-- Script pour ajouter le champ is_ranked aux étudiants
-- Permet de marquer certains élèves comme "Non Classé" (NC)

-- Ajouter la colonne is_ranked à la table students
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT true;

-- Mettre à jour tous les élèves existants comme classés par défaut
UPDATE students SET is_ranked = true WHERE is_ranked IS NULL;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN students.is_ranked IS 'Si false, l''élève est Non Classé (NC) et n''influence pas les statistiques de la classe';
