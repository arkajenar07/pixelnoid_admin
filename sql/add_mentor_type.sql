-- ==============================================================================
-- PIXELNOID LMS - ADD TYPE COLUMN TO MENTORSHIP SESSIONS
-- ==============================================================================

-- Tambahkan kolom 'type' ke tabel public.mentorship_sessions (main_class vs casual_class)
ALTER TABLE public.mentorship_sessions 
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'main_class';

-- Indexing untuk optimasi query berdasarkan type sesi
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_type ON public.mentorship_sessions(type);
