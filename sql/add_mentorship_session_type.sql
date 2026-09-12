-- Tambahkan kolom 'type' ke tabel mentorship_sessions untuk menandai jenis sesi (main_class vs casual_class)
ALTER TABLE public.mentorship_sessions 
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'main_class';

-- Indexing untuk optimasi query berdasarkan type sesi
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_type ON public.mentorship_sessions(type);
