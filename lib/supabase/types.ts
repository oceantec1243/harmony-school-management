// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      sections: {
        Row: {
          id: string
          name: "Francophone" | "Anglophone"
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: "Francophone" | "Anglophone"
          description?: string | null
        }
        Update: {
          name?: "Francophone" | "Anglophone"
          description?: string | null
        }
      }
      levels: {
        Row: {
          id: string
          name: string
          section_id: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          section_id: string
          order?: number
        }
        Update: {
          name?: string
          section_id?: string
          order?: number
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          level_id: string
          section_id: string
          capacity: number
          academic_year: string
          class_teacher: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          level_id: string
          section_id: string
          capacity?: number
          academic_year?: string
          class_teacher?: string | null
        }
        Update: {
          name?: string
          level_id?: string
          section_id?: string
          capacity?: number
          academic_year?: string
          class_teacher?: string | null
        }
      }
      students: {
        Row: {
          id: string
          matricule: string
          first_name: string
          last_name: string
          date_of_birth: string
          place_of_birth: string | null
          gender: "M" | "F"
          photo: string | null
          class_id: string
          father_name: string | null
          father_phone: string | null
          mother_name: string | null
          mother_phone: string | null
          guardian_name: string | null
          guardian_phone: string | null
          address: string | null
          status: "Active" | "Suspended" | "Graduated"
          enrollment_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          matricule: string
          first_name: string
          last_name: string
          date_of_birth: string
          place_of_birth?: string | null
          gender: "M" | "F"
          photo?: string | null
          class_id: string
          father_name?: string | null
          father_phone?: string | null
          mother_name?: string | null
          mother_phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          address?: string | null
          status?: "Active" | "Suspended" | "Graduated"
          enrollment_date?: string
        }
        Update: {
          matricule?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          place_of_birth?: string | null
          gender?: "M" | "F"
          photo?: string | null
          class_id?: string
          father_name?: string | null
          father_phone?: string | null
          mother_name?: string | null
          mother_phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          address?: string | null
          status?: "Active" | "Suspended" | "Graduated"
        }
      }
      subject_groups: {
        Row: {
          id: string
          name: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          order?: number
        }
        Update: {
          name?: string
          order?: number
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          subject_group_id: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          subject_group_id: string
          description?: string | null
        }
        Update: {
          name?: string
          code?: string
          subject_group_id?: string
          description?: string | null
        }
      }
      level_subjects: {
        Row: {
          id: string
          subject_id: string
          level_id: string
          section_id: string
          coefficient: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          level_id: string
          section_id: string
          coefficient?: number
        }
        Update: {
          coefficient?: number
        }
      }
      class_subjects: {
        Row: {
          id: string
          subject_id: string
          class_id: string
          coefficient: number
          teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          class_id: string
          coefficient?: number
          teacher_id?: string | null
        }
        Update: {
          coefficient?: number
          teacher_id?: string | null
        }
      }
      teachers: {
        Row: {
          id: string
          email: string | null
          first_name: string
          last_name: string
          phone: string | null
          photo: string | null
          specialization: string | null
          status: "active" | "inactive"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          first_name: string
          last_name: string
          phone?: string | null
          photo?: string | null
          specialization?: string | null
          status?: "active" | "inactive"
        }
        Update: {
          email?: string | null
          first_name?: string
          last_name?: string
          phone?: string | null
          photo?: string | null
          specialization?: string | null
          status?: "active" | "inactive"
        }
      }
      academic_periods: {
        Row: {
          id: string
          academic_year: string
          type: "sequence" | "trimester" | "year"
          name: string
          number: number
          start_date: string | null
          end_date: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academic_year?: string
          type: "sequence" | "trimester" | "year"
          name: string
          number: number
          start_date?: string | null
          end_date?: string | null
          parent_id?: string | null
        }
        Update: {
          academic_year?: string
          type?: "sequence" | "trimester" | "year"
          name?: string
          number?: number
          start_date?: string | null
          end_date?: string | null
          parent_id?: string | null
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          class_subject_id: string | null
          level_subject_id: string | null
          academic_period_id: string
          score: number
          coefficient: number
          entered_by: string | null
          entered_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          class_subject_id?: string | null
          level_subject_id?: string | null
          academic_period_id: string
          score: number
          coefficient?: number
          entered_by?: string | null
        }
        Update: {
          score?: number
          coefficient?: number
        }
      }
      comments: {
        Row: {
          id: string
          student_id: string
          academic_period_id: string
          type: "conduct" | "council" | "subject"
          subject_id: string | null
          content: string
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          academic_period_id: string
          type: "conduct" | "council" | "subject"
          subject_id?: string | null
          content: string
          author_id?: string | null
        }
        Update: {
          content?: string
        }
      }
      school_settings: {
        Row: {
          id: string
          school_name: string
          school_slogan: string | null
          logo_url: string | null
          watermark_url: string | null
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          current_academic_year: string
          grading_scale: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_name?: string
          school_slogan?: string | null
          logo_url?: string | null
          watermark_url?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          current_academic_year?: string
          grading_scale?: number
        }
        Update: {
          school_name?: string
          school_slogan?: string | null
          logo_url?: string | null
          watermark_url?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          current_academic_year?: string
          grading_scale?: number
        }
      }
    }
  }
}
