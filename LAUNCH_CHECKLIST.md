# 🚀 SociMe — Checklist השקה

מסמך מרוכז של כל מה שצריך לפני עלייה לאוויר. סומן ✅ מה שכבר עובד, ⬜ מה שנשאר, ו-🔴 למה שקריטי/מסוכן.

עודכן: 2026-07-06

---

## 1. דומיין ו-DNS — `socime.co.il`
- ⬜ לרכוש `socime.co.il` (רשם מוסמך ISOC: LiveDNS / Wix / domainthenet).
- ⬜ (מומלץ) לרכוש גם `socime.com` ולהפנות לראשי.
- ⬜ לחבר את הדומיין ל-Vercel (Settings → Domains) ולהדביק את רשומת ה-DNS שהם נותנים.
- ⬜ **לאחד את הקוד לדומיין אחד** — כרגע מפוצל בין `socime.io` ל-`socime.co.il`. אחרי הרכישה תגיד לי ואני מיישר את הכל (מיילים משפטיים, `NEXT_PUBLIC_SITE_URL`, `LEAD_FROM_EMAIL`, מוקאפ הנחיתה).

## 2. משתני סביבה (Environment Variables ב-Vercel)
> ⚠️ `.env.local` הוא רק לפיתוח. כל המפתחות חייבים להיות מוגדרים גם ב-Vercel → Project → Settings → Environment Variables.

- ✅ `GEMINI_API_KEY` — קיים ועובד (כל ה-AI).
- ✅ `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
- ✅ `META_APP_ID` / `META_APP_SECRET` / `META_ACCESS_TOKEN` / `META_PAGE_ID` / `META_IG_ACCOUNT_ID`.
- ✅ `CLOUDINARY_*` (עורך הווידאו / תמונות).
- ⬜ `NEXT_PUBLIC_SITE_URL` = `https://socime.co.il` (משמש ל-OAuth redirects ולמיילים).
- ⬜ 🔴 `CRON_SECRET` — חובה! בלעדיו ה-cron (פרסום/חידושים/טוקנים) לא ירוץ מאובטח. להגדיר מחרוזת אקראית חזקה.
- ⬜ מפתח ההצפנה של `lib/crypto.ts` (ה-AES של הטוקנים החברתיים) — לוודא שמוגדר ב-Vercel.
- ⬜ `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` — placeholders (ראה §5).
- ⬜ `PAYPLUS_*` (ראה §3).
- ⬜ `RESEND_API_KEY` / `LEAD_FROM_EMAIL` (ראה §4).

## 3. 🔴 תשלומים — PayPlus (הכי קריטי, יש בו כסף אמיתי)
- ⬜ להזין מפתחות אמיתיים: `PAYPLUS_API_KEY`, `PAYPLUS_SECRET`, `NEXT_PUBLIC_PAYPLUS_PAGE_UID`, `PAYPLUS_TERMINAL_UID`.
- ⬜ 🔴 **לאמת מול התיעוד הרשמי של PayPlus** את ההנחות שסומנו `VERIFY` בקוד:
  - חתימת ה-webhook — header `x-payplus-signature` + HMAC-SHA256 hex (`app/api/payplus/webhook/route.ts`).
  - שם השדה לשמירת טוקן כרטיס (`create_token` ב-checkout).
  - endpoint + שדות החיוב לחידוש אוטומטי (`app/api/cron/renewals`).
- ⬜ לבצע רכישת בדיקה אמיתית מקצה לקצה: checkout → webhook מעדכן tier+טוקנים → מופיע בטבלת `transactions`.
- ⬜ לבדוק חידוש אוטומטי: להריץ `/api/cron/renewals` ידנית עם מנוי שפג, ולוודא חיוב + הארכה.
- ⬜ לוודא ש-`/api/payplus/webhook` מוגדר כ-Webhook URL בלוח הבקרה של PayPlus.

## 4. מיילים
- ⬜ **Resend** (מיילי הלידים מהנחיתה): לפתוח חשבון, לאמת את `socime.co.il`, להזין `RESEND_API_KEY` + `LEAD_FROM_EMAIL`. עד אז הלידים נשמרים אבל לא נשלח מייל.
- ⬜ **מיילי Auth של Supabase** (איפוס סיסמה): כרגע דרך ה-SMTP המובנה של Supabase (מוגבל ~3-4 מיילים בשעה, מתאים רק לבדיקות). לפרודקשן — להגדיר SMTP מותאם ב-Supabase → Auth → SMTP Settings (אפשר גם דרך Resend).
- ⬜ לבדוק בפועל: "שכחתי סיסמה" → מגיע מייל → הקישור עובד ומעדכן סיסמה.

## 5. חיבורי רשתות (OAuth)
- ⬜ **Meta**: לאשר את ה-redirect URI `https://socime.co.il/api/social/oauth/facebook/callback` בהגדרות האפליקציה ב-Meta for Developers. לבדוק חיבור פייסבוק+אינסטגרם אמיתי מקצה לקצה.
- ⬜ **TikTok**: לפתוח אפליקציה ב-developers.tiktok.com (Login Kit + Content Posting API), להזין מפתחות, לאשר את ה-redirect `.../api/social/oauth/tiktok/callback`.
- ⬜ לבדוק פרסום אמיתי לכל רשת (פוסט בודד → מתפרסם).

## 6. מסד נתונים
- ✅ כל ה-migrations מיושמים על ה-DB החי ושמורים כקבצים ב-`supabase/migrations/`.
- ⬜ לוודא ש-RLS מופעל על טבלאות רגישות (leads כבר נעול; לעבור על השאר).
- ⬜ גיבוי אוטומטי מופעל ב-Supabase (Point-in-Time Recovery בתוכניות בתשלום).

## 7. משפטי ותוכן
- ⬜ 🔴 **ישות משפטית**: המסמכים מדברים על "SociMe" — להוסיף שם חברה רשמי + ח.פ. (EDRI GROUP) בתקנון/פרטיות.
- ⬜ לאחד את כתובות המייל המשפטיות לדומיין הסופי (`legal@`, `privacy@`, `support@socime.co.il`).
- ✅ תקנון + פרטיות קיימים; ספק ה-AI (Google Gemini) וסעיף התשלום מעודכנים ונכונים.

## 8. בדיקת עשן לפני עלייה (Smoke Test)
לרוץ על הזרימה המלאה בפרודקשן אחרי הדיפלוי:
- ⬜ הרשמה (אימייל) → onboarding → דשבורד.
- ⬜ יצירת פוסט ב-AI → ניכוי טוקנים → מונה מתעדכן.
- ⬜ תזמון פוסט → מופיע בתור כ-`queued`.
- ⬜ חיבור רשת אמיתית → פרסום.
- ⬜ רכישת מנוי (PayPlus אמיתי) → שדרוג tier.
- ⬜ "שכחתי סיסמה" מקצה לקצה.
- ⬜ Light mode עובד.

## 9. דיפלוי (Vercel) + Cron
- ✅ `vercel.json` מגדיר 3 crons: פרסום (כל דקה), איפוס טוקנים (1 לחודש), חידושים (יומי 06:00).
- ⬜ לוודא שה-Cron מופעל ב-Vercel (דורש תוכנית Pro ל-cron תכוף).
- ⬜ לבדוק ש-build עובר בפרודקשן (`npm run build`).
- ⬜ לוודא ש-Sentry (אם מוגדר) מחובר ללכידת שגיאות.

## 10. אחרי ההשקה — ניטור
- ⬜ לעקוב אחרי `/admin/leads` — הלידים הראשונים.
- ⬜ לעקוב אחרי `/admin` — משתמשים, שגיאות, שימוש בטוקנים.
- ⬜ לגייס 2-3 עסקי פיילוט אמיתיים → להחליף את ה-trust bar בציטוט אמיתי אחד עם שם ואישור.
- ⬜ להקליט וידאו אמיתי של הדשבורד → להחליף את ה-placeholder במוקאפ הדפדפן בנחיתה.

---

### סדר עדיפויות מומלץ
1. דומיין (§1) → נותן בסיס לכל השאר.
2. `CRON_SECRET` + כל המפתחות ב-Vercel (§2).
3. PayPlus — אימות חתימה + בדיקת רכישה (§3). **לא להשיק עם תשלומים לא-מאומתים.**
4. Meta + TikTok OAuth (§5).
5. Smoke test מלא (§8) → עלייה לאוויר.
