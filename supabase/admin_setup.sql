-- ══════════════════════════════════════════
-- SociMe — Admin / Founder Account Setup
-- הרץ ב: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════

-- 1. הוספת שדה role לטבלת users (להרשאות אדמין עתידיות)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'editor', 'admin', 'founder'));

-- 2. העלאת חשבון המייסד להרשאות מלאות
UPDATE users
SET role          = 'founder',
    tier          = 'pro',
    plan          = 'pro',
    token_balance = 999999,
    status        = 'active'
WHERE lower(email) = 'doredri58@gmail.com';

-- 3. בדיקה — אמור להחזיר שורה אחת עם role=founder, tier=pro
SELECT email, name, role, tier, token_balance, status
FROM users
WHERE lower(email) = 'doredri58@gmail.com';

-- 4. העלאת חשבון המייסד להרשאות מלאות
UPDATE users
SET role          = 'Admin',
    tier          = 'pro',
    plan          = 'pro',
    token_balance = 999999,
    status        = 'active'
WHERE lower(email) = 'rodnikk@gmail.com';
