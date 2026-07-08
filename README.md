# SociMe — AI Social Media Manager

> ⚠️ **חלקים מ-README זה מיושנים** (למשל מבנה קבצים ישן, `PaywallForm.tsx` שנמחק).
> מקור האמת המעודכן על המצב הקיים בפועל: **[SPEC.md](SPEC.md)**.

## הפעלה מקומית

### 1. התקנת Dependencies
```bash
npm install
```

### 2. הגדרת משתני סביבה
ערוך את הקובץ `.env.local` והכנס את המפתחות שלך:
```
NEXT_PUBLIC_SUPABASE_URL=...       ← מ-supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  ← מ-supabase.com/dashboard
SUPABASE_SERVICE_ROLE_KEY=...      ← Settings → API → service_role
OPENAI_API_KEY=sk-...              ← platform.openai.com/api-keys
META_ACCESS_TOKEN=...              ← developers.facebook.com
META_PAGE_ID=...                   ← מזהה עמוד הפייסבוק שלך
META_IG_ACCOUNT_ID=...             ← מזהה חשבון ה-Instagram העסקי
```

### 3. הקמת מסד הנתונים
1. צור פרויקט חדש ב-supabase.com
2. SQL Editor → הדבק `supabase/schema.sql` → Run

### 4. הפעלה
```bash
npm run dev
```
פתח http://localhost:3000

---

## Deploy ל-Vercel

```bash
git init && git add . && git commit -m "SociMe initial"
# Push ל-GitHub, אז Import ב-vercel.com
# הוסף את כל משתני .env.local בהגדרות Vercel → Deploy ✅
```

---

## מבנה הפרויקט

```
app/
  page.tsx              ← דף ראשי (Hero + Story + Features + Schema)
  layout.tsx            ← RTL + Heebo font
  api/
    generate/           ← POST: OpenAI post generation + moderation
    auth/register/      ← POST: Supabase signup + draft save
    auth/login/         ← POST: Supabase signin
    scheduler/          ← GET/POST: manage posts
    scheduler/[id]/     ← PATCH: update post status
    meta/publish/       ← POST: publish to Facebook + Instagram
components/
  Drawer.tsx            ← Slide menu RTL
  ChatBot.tsx           ← AI chatbot (calls /api/generate)
  PaywallForm.tsx       ← Register/Login + Stripe placeholder
lib/
  supabase.ts           ← Supabase clients
  openai.ts             ← OpenAI + Hebrew system prompt
  meta.ts               ← Meta Graph API
supabase/
  schema.sql            ← 4 tables: users, transactions, token_ledger, scheduler
```
