-- ==============================================================================
-- PIXELNOID LMS - STUDENT MANAGEMENT & ASSIGNMENTS SCHEMA
-- ==============================================================================
-- Deskripsi:
-- 1. Tabel 'assignments' untuk master penugasan (Quizizz, Praktek, Studi Kasus).
-- 2. Tabel 'student_assignments' untuk tracking penugasan siswa, link submission,
--    dan feedback/nilai dari mentor.
-- 3. Trigger otomatis 'updated_at', RLS policies, dan sample data.
-- ==============================================================================

-- 1. Enable UUID extension jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat tabel master penugasan (assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('quizizz', 'practice', 'case_study')),
    link_url TEXT,      -- Link referensi/soal/quizizz dari admin/mentor
    due_date TIMESTAMPTZ,  -- Batas waktu pengumpulan
    -- Gunakan public.users (bukan auth.users) agar Supabase PostgREST bisa join via Foreign Key
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.assignments IS 'Daftar master tugas yang dibuat oleh admin/mentor';
COMMENT ON COLUMN public.assignments.type IS 'Tipe tugas: quizizz, practice, atau case_study';
COMMENT ON COLUMN public.assignments.link_url IS 'Link instruksi atau quizizz dari pembuat tugas';

-- 3. Buat tabel relasi penugasan siswa (student_assignments)
CREATE TABLE IF NOT EXISTS public.student_assignments (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    -- Gunakan public.users (bukan auth.users) agar PostgREST bisa JOIN via FK users!student_id
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed')),
    submission_url TEXT,    -- Link tugas yang diupload oleh siswa (Figma/Drive/GitHub/dsb)
    submission_notes TEXT,  -- Catatan tambahan dari siswa saat upload link
    submitted_at TIMESTAMPTZ,
    grade NUMERIC(5, 2) DEFAULT NULL,  -- Nilai dari mentor (0 - 100)
    feedback TEXT,          -- Catatan feedback atau saran dari mentor
    feedback_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Mentor yang memberi feedback
    feedback_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_assignment UNIQUE (assignment_id, student_id)
);

COMMENT ON TABLE public.student_assignments IS 'Relasi tugas ke masing-masing siswa beserta status pengumpulan dan feedback';
COMMENT ON COLUMN public.student_assignments.status IS 'Status tugas: pending (belum upload), submitted (sudah upload), reviewed (sudah dinilai mentor)';
COMMENT ON COLUMN public.student_assignments.submission_url IS 'Link hasil pengerjaan siswa';

-- 4. Indexing untuk optimasi query performa tinggi
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON public.assignments(type);
CREATE INDEX IF NOT EXISTS idx_student_assignments_assignment_id ON public.student_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON public.student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_status ON public.student_assignments(status);

-- 5. Trigger Function untuk auto-update kolom updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada tabel assignments
DROP TRIGGER IF EXISTS trg_assignments_updated_at ON public.assignments;
CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Pasang trigger pada tabel student_assignments
DROP TRIGGER IF EXISTS trg_student_assignments_updated_at ON public.student_assignments;
CREATE TRIGGER trg_student_assignments_updated_at
    BEFORE UPDATE ON public.student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;

-- Policy untuk tabel assignments
-- Admin & Mentor memiliki full access, Student dapat melihat tugas yang di-assign padanya
CREATE POLICY "Admin & Mentor full access on assignments"
    ON public.assignments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND (u.roles @> ARRAY['admin']::text[] OR u.roles @> ARRAY['mentor']::text[])
        )
    );

CREATE POLICY "Students can view assigned assignments"
    ON public.assignments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.student_assignments sa
            WHERE sa.assignment_id = public.assignments.id
            AND sa.student_id = auth.uid()
        )
    );

-- Policy untuk tabel student_assignments
CREATE POLICY "Admin & Mentor full access on student_assignments"
    ON public.student_assignments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND (u.roles @> ARRAY['admin']::text[] OR u.roles @> ARRAY['mentor']::text[])
        )
    );

CREATE POLICY "Students can view and update their own submissions"
    ON public.student_assignments
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Students can submit their own assignment link"
    ON public.student_assignments
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());
