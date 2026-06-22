-- ══════════════════════════════════════════
-- SociMe — Bulk Upload Storage Bucket
-- הרץ ב: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════

-- יצירת bucket לקבצי משתמשים
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-media',
  'user-media',
  true,
  52428800,  -- 50MB לקובץ
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- קריאה ציבורית (לתצוגה בפוסטים)
CREATE POLICY "public read user media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-media');

-- העלאה — רק המשתמש עצמו לתיקיית ה-userId שלו
CREATE POLICY "users upload own media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- מחיקה — רק המשתמש עצמו
CREATE POLICY "users delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
