-- ==============================================================================
-- PIXELNOID LMS - STUDENT PROGRESS REPORTS SCHEMA
-- ==============================================================================
-- Deskripsi:
-- Tabel 'student_progress_reports' untuk menyimpan riwayat laporan perkembangan
-- siswa yang di-generate oleh AI (Gemini) dari input terstruktur mentor.
-- ==============================================================================

-- 1. Helper function updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tabel Utama: public.student_progress_reports
CREATE TABLE IF NOT EXISTS public.student_progress_reports (
    id BIGSERIAL PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    mentor_name VARCHAR(255) NOT NULL,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    program VARCHAR(255) NOT NULL,
    period VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    generated_report JSONB NOT NULL,
    human_readable_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.student_progress_reports IS 'Riwayat laporan evaluasi dan perkembangan siswa yang di-generate AI';
COMMENT ON COLUMN public.student_progress_reports.input_data IS 'Data terstruktur input awal dari mentor (JSON)';
COMMENT ON COLUMN public.student_progress_reports.generated_report IS 'Hasil output terstruktur AI (JSON)';

-- 3. Indexing untuk kecepatan pencarian
CREATE INDEX IF NOT EXISTS idx_progress_reports_student_name ON public.student_progress_reports(student_name);
CREATE INDEX IF NOT EXISTS idx_progress_reports_period ON public.student_progress_reports(period);
CREATE INDEX IF NOT EXISTS idx_progress_reports_created_at ON public.student_progress_reports(created_at DESC);

-- 4. Trigger auto updated_at
DROP TRIGGER IF EXISTS trg_progress_reports_updated_at ON public.student_progress_reports;
CREATE TRIGGER trg_progress_reports_updated_at
    BEFORE UPDATE ON public.student_progress_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.student_progress_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin & Mentor full access on student_progress_reports" ON public.student_progress_reports;
CREATE POLICY "Admin & Mentor full access on student_progress_reports"
    ON public.student_progress_reports
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND (u.roles @> ARRAY['admin']::text[] OR u.roles @> ARRAY['mentor']::text[])
        )
    );

DROP POLICY IF EXISTS "Students can view their own progress reports" ON public.student_progress_reports;
CREATE POLICY "Students can view their own progress reports"
    ON public.student_progress_reports
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

