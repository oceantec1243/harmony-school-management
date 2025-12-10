-- Script pour créer la table des périodes où un élève est non classé
-- Cela permet de marquer un élève comme NC pour certaines séquences uniquement

-- Supprimer l'ancienne colonne is_ranked si elle existe (on la remplace par la nouvelle table)
-- ALTER TABLE students DROP COLUMN IF EXISTS is_ranked;

-- Créer la table student_unranked_periods
CREATE TABLE IF NOT EXISTS student_unranked_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(student_id, academic_period_id)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_student_unranked_periods_student ON student_unranked_periods(student_id);
CREATE INDEX IF NOT EXISTS idx_student_unranked_periods_period ON student_unranked_periods(academic_period_id);

-- Activer RLS
ALTER TABLE student_unranked_periods ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations
CREATE POLICY "Allow all for student_unranked_periods" ON student_unranked_periods FOR ALL USING (true) WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE student_unranked_periods IS 'Table pour gérer les périodes où un élève est non classé (NC)';
COMMENT ON COLUMN student_unranked_periods.student_id IS 'ID de l''élève';
COMMENT ON COLUMN student_unranked_periods.academic_period_id IS 'ID de la période académique (séquence, trimestre, année)';
COMMENT ON COLUMN student_unranked_periods.reason IS 'Raison du non classement (optionnel)';
