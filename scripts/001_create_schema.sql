-- HARMONY School Management System - Database Schema
-- Run this script to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- SECTIONS (Francophone / Anglophone)
-- ========================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Francophone', 'Anglophone')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- LEVELS (6ème, 5ème, etc.)
-- ========================================
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, section_id)
);

-- ========================================
-- CLASSES (6ème A, 6ème B, etc.)
-- ========================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL DEFAULT 50,
  academic_year TEXT NOT NULL DEFAULT '2024-2025',
  class_teacher TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, academic_year)
);

-- ========================================
-- STUDENTS
-- ========================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricule TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  photo TEXT,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  father_name TEXT,
  father_phone TEXT,
  mother_name TEXT,
  mother_phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Graduated')),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SUBJECT GROUPS (Groupe I, II, III...)
-- ========================================
CREATE TABLE IF NOT EXISTS subject_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SUBJECTS (Master list)
-- ========================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  subject_group_id UUID NOT NULL REFERENCES subject_groups(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- LEVEL SUBJECTS (Tronc commun)
-- ========================================
CREATE TABLE IF NOT EXISTS level_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  coefficient INTEGER NOT NULL DEFAULT 1 CHECK (coefficient >= 1 AND coefficient <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, level_id, section_id)
);

-- ========================================
-- CLASS SUBJECTS (Spécialités + assignation professeur)
-- ========================================
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  coefficient INTEGER NOT NULL DEFAULT 1 CHECK (coefficient >= 1 AND coefficient <= 10),
  teacher_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, class_id)
);

-- ========================================
-- TEACHERS
-- ========================================
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  specialization TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to class_subjects for teacher
ALTER TABLE class_subjects
ADD CONSTRAINT fk_class_subjects_teacher
FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- ========================================
-- ACADEMIC PERIODS
-- ========================================
CREATE TABLE IF NOT EXISTS academic_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year TEXT NOT NULL DEFAULT '2024-2025',
  type TEXT NOT NULL CHECK (type IN ('sequence', 'trimester', 'year')),
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  parent_id UUID REFERENCES academic_periods(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academic_year, type, number)
);

-- ========================================
-- GRADES
-- ========================================
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_subject_id UUID REFERENCES class_subjects(id) ON DELETE SET NULL,
  level_subject_id UUID REFERENCES level_subjects(id) ON DELETE SET NULL,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 20),
  coefficient INTEGER NOT NULL DEFAULT 1,
  entered_by UUID,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, academic_period_id)
);

-- ========================================
-- COMMENTS / OBSERVATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('conduct', 'council', 'subject')),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SCHOOL SETTINGS
-- ========================================
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name TEXT NOT NULL DEFAULT 'HARMONY',
  school_slogan TEXT DEFAULT 'L''harmonie entre technologie et éducation',
  logo_url TEXT,
  watermark_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  current_academic_year TEXT DEFAULT '2024-2025',
  grading_scale INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_matricule ON students(matricule);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_period ON grades(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_grades_lookup ON grades(student_id, subject_id, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level_id);
CREATE INDEX IF NOT EXISTS idx_classes_section ON classes(section_id);
CREATE INDEX IF NOT EXISTS idx_level_subjects_level ON level_subjects(level_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON class_subjects(class_id);

-- ========================================
-- TRIGGERS for updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- RLS POLICIES (Open for now - adjust for production)
-- ========================================
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust for production with proper auth)
CREATE POLICY "Allow all for sections" ON sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for levels" ON levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for subject_groups" ON subject_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for level_subjects" ON level_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for class_subjects" ON class_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for academic_periods" ON academic_periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for grades" ON grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for school_settings" ON school_settings FOR ALL USING (true) WITH CHECK (true);
