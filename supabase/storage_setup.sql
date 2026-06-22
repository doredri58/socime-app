-- ══════════════════════════════════════════
-- SociMe — Storage Bucket for Generated Images
-- הרץ ב: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════

-- יצירת bucket ציבורי לתמונות שנוצרו
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Policies ──────────────────────────────

-- קריאה ציבורית (כדי שהתמונות יוצגו בפוסטים ברשתות)
CREATE POLICY "public read generated images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

-- העלאה — רק דרך service role (ה-API שלנו). אין צורך ב-policy נוסף
-- כי service role עוקף RLS. אם תרצה לאפשר העלאה מהדפדפן ישירות:
-- CREATE POLICY "users upload own images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);
