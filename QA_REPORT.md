# SociMe — דוח QA מקיף

> נוצר: 2026-07-08 · מבוסס על סריקה שיטתית **קובץ-קובץ** של כל בסיס הקוד (150+ קבצים) ע"י 5 סוכני QA במקביל, בקריאה מלאה של כל קובץ.
> ממצאי DB וזרימת התזמון **אומתו** מול הסכמה החיה של Supabase ומול הקוד. תגיות: **[✅ מאומת]** = אימתתי אישית מול קוד/DB · **[סביר]** = דווח בסריקה, לא אומת עצמאית.

## תקציר לפי חומרה
| חומרה | כמות | משמעות |
|-------|:---:|--------|
| 🔴 CRITICAL | 3 | פונקציונליות ליבה שבורה / פרצת אבטחה |
| 🟠 HIGH | 19 | באג משמעותי, נתונים שגויים ללקוח, או פיצ'ר מזויף |
| 🟡 MEDIUM | 24 | באג בינוני / UX שגוי / חוסר עקביות |
| 🔵 LOW | 15 | בעיה קלה / קוסמטי |
| ⚪ NIT | 8 | הערה/שיפור |

## נושאים חוצי-קוד (דפוסים חוזרים)
1. **אי-התאמת camelCase↔snake_case בין קליינט ל-API** — גורם לבאג הקריטי בתזמון + עריכת טוקנים ב-God Mode. יש לאחד קונבנציה.
2. **פערי מסלול `agency`** — Sidebar, GodMode, admin/stats, MRR — כולם מתעלמים מ-agency (נספר כ-free / תג "חינמי"). (admin/billing כבר תוקן.)
3. **מחירים/עלויות-טוקנים מיושנים** ב-3 מקומות מול `lib/plans.ts` — payment/success, PricingPlans, UpgradeModal, help — מוצגים ללקוח לפני/אחרי תשלום.
4. **נתונים מזויפים המוצגים כאמיתיים** — GodMode, settings (צוות/מכשירים), CommunityInbox (triage), AnalyticsDashboard (leaderboard).
5. **שאילתות לעמודות DB לא-קיימות** — `transactions.status`, `scheduler.content` — שוברות דפי אדמין שלמים.
6. **אזכורי ספק AI שגויים** — help/AdminApis/AdminAi/GodMode מזכירים OpenAI/Claude/Anthropic, בעוד המערכת על **Gemini בלבד**.

---

## 🔴 CRITICAL

**C1 · תזמון פוסט מהלוח-שנה שבור — התאריך נזרק** · `[✅ מאומת]`
`components/dashboard/CalendarView.tsx:350` שולח `{ contentText, platform, scheduled_at, status:'scheduled' }`, אבל `app/api/scheduler/route.ts:9` קורא **`scheduledAt`** (camelCase) ומתעלם מ-`scheduled_at`. תוצאה: `scheduledAt===undefined` → `status:'draft'`, `scheduled_at:null`. התאריך/שעה שהמשתמש בחר נמחקים, הפוסט **לא נכנס לתור ולא מתפרסם לעולם**. זו הזרימה המרכזית של המוצר. בנוסף `save()` לא בודק `res.ok` → מציג "הצלחה" גם על כשל.

**C2 · פרסום מתוזמן דרך ה-cron תמיד נכשל — אי-התאמת טיפוס `platform`** · `[✅ מאומת]`
`scheduler.platform` הוא `text[]` (מערך). `app/api/cron/process/route.ts:21,47` שולף אותו ומעביר ל-`processDuePost` כ-`SchedulerRow` (שם `platform` מוגדר `string`). ב-`lib/publisher.ts` ההשוואה `row.platform === 'facebook'` נכשלת (מערך≠מחרוזת), וגם חיפוש הטוקן `.eq('platform', row.platform)` נכשל. תוצאה: כל פוסט שכן הגיע לתור נכשל ("אין token"/"פלטפורמה לא נתמכת") ונכנס ל-retry עד failed. (נתיב הפרסום המיידי `/api/publish` תקין כי בונה platform כמחרוזת יחידה.)

**C3 · `/api/notifications/inbox` POST — ללא אימות, סומך על userId מהגוף** · `[סביר]`
`app/api/notifications/inbox/route.ts` POST אינו בודק session וכותב ל-`user_id` שרירותי מגוף הבקשה. כל אדם (גם לא מחובר) יכול ליצור התראות מזויפות לכל משתמש. IDOR + spoofing. אין try/catch ואין ולידציה.

---

## 🟠 HIGH

**API ואבטחה**
- **H1** `app/api/bulk-upload/route.ts:56` — מכניס `status:'pending'` ל-`scheduler`, אך זה **אינו ערך חוקי** ב-CHECK constraint → כל ההעלאות המרובות נכשלות בשקט (נשמרות ל-Storage אך לא לתור). `[✅ מאומת — enum לא כולל 'pending']`
- **H2** `app/api/community/reply/route.ts:12-31` — מקבל `commentId` ו-`pageAccessToken` **ישירות מהגוף** ומפרסם ל-Graph, בלי לשלוף את הטוקן השמור ובלי לאמת בעלות. broken access control. `[סביר]`
- **H3** `app/api/community/comments/route.ts:126,179` — מחזיר **page access tokens** של פייסבוק/IG ל-דפדפן ב-JSON. דליפת סוד (טוקן דף מאפשר פרסום/מחיקה). `[סביר]`
- **H4** `app/api/scheduler/[id]/route.ts:14-22` — PATCH מעביר את **כל גוף הבקשה** ל-`.update()` בלי whitelist (mass-assignment): קליינט יכול לזייף `status:'published'`, `meta_post_id`, `attempt_count` וכו'. `[סביר]`
- **H5** `app/api/payplus/webhook/route.ts:9-13` — אימות HMAC עם `===` (לא `timingSafeEqual`) + עדכון `users` ו-insert `transactions` **לא אטומיים ולא נבדקים לשגיאה** → webhook חוזר עלול להעניק טוקנים כפול, או להעניק בלי רשומת עסקה. `[סביר]`
- **H6** `lib/tokens.ts:61-69` — `deductTokens` מריץ insert+RPC ב-`Promise.all` בלי בדיקת error/טרנזקציה → פערי חשבונאות בטוקנים (שירות בלי ניכוי, או ניכוי בלי ledger). `[סביר]`
- **H7** `lib/agentRoute.ts:35-44` — TOCTOU: בדיקת יתרה ואז ניכוי בלי נעילה → שתי בקשות מקבילות עוברות, המשתמש מקבל שירות מעבר ליתרתו. `[סביר]`

**נתונים שגויים ללקוח / פיצ'רים מזויפים**
- **H8** `app/payment/success/page.tsx:6-9` — `PLAN_NAMES` שגוי: basic=100 טוקנים/₪49, pro=300/₪99, אין agency. אמיתי: 500/₪199, 1000/₪299, 2000/₪999. **קבלת תשלום עם נתונים מומצאים.** `[✅ מאומת מול plans.ts]`
- **H9** `components/pricing/PricingPlans.tsx:16-20` — `TOKEN_COSTS` ללקוח: וידאו=15, תמונה=5, פוסט=2. אמיתי: 10/25/10. לקוח מעריך פי-5 יותר פוסטים ממה שיקבל. `[✅ מאומת מול tokens.ts]`
- **H10** `components/dashboard/UpgradeModal.tsx:11,18,104` — מציג "Pro ₪99 / 300 טוקנים" אבל שולח `plan:'pro'` שגובה ₪299/1000. פער מחיר לפני תשלום. `[✅ מאומת]`
- **H11** `app/admin/billing/page.tsx:13` + `AdminBillingClient.tsx` — בוחר `transactions.status` **שלא קיים** → השאילתה נכשלת (400) → עמוד החיובים תמיד "אין תוצאות", הכנסות=0. `[✅ מאומת — אין עמודת status]`
- **H12** `app/admin/logs/page.tsx:12-13` — בוחר `scheduler.content` (צ"ל `content_text`) **וגם** `transactions.status` (לא קיים) → **עמוד הלוגים תמיד ריק**. `[✅ מאומת]`
- **H13** `components/admin/GodModeDashboard.tsx:279-288` — `impersonate` מתעלם מה-`magicLink` שהשרת מחזיר ורק מנווט ל-`/dashboard` → **התחזות לא עובדת**, האדמין רואה את עצמו. `[סביר]`
- **H14** `components/admin/GodModeDashboard.tsx` — כמות גדולה של **נתונים מזויפים** מוצגים כאמת: latency/requests/error-rate (600-611), משתמשים מזויפים (617-634), "AI API Costs $0 · OpenAI·Claude" (384-390, גם ספק שגוי), Data Pipeline (671-691). `[סביר]`
- **H15** `app/dashboard/settings/page.tsx:440-543` — TeamTab עם חברי צוות **מזויפים** (דוד לוי/שרה כהן); `sendInvite` לא קורא ל-API. `[סביר]`
- **H16** `app/dashboard/settings/page.tsx:143-147,335-390` — "מכשירים פעילים" רשימה **מזויפת**; כפתורי "נתק" לא עושים כלום. `[סביר]`
- **H17** `components/dashboard/BillingDashboard.tsx:130-136` — `saveBillingDetails` עושה `setTimeout` ומציג "עודכן ✓" **בלי שום fetch** → פרטי החיוב (שם/ח.פ/כתובת) נזרקים. `[סביר]`
- **H18** `components/dashboard/VideoEditor.tsx:694` — תמלול/כתוביות **לעולם לא רצים**: `if (subtitles && cloudinaryUrl)` מסתמך על state שנקבע באותו closure ועדיין `null`. `[סביר]`
- **H19** `app/api/notifications/inbox/route.ts` — (בנוסף ל-C3) אין ולידציה על `title`/`userId` ואין try/catch → 500 גולמי / insert פגום. `[סביר]`

---

## 🟡 MEDIUM

- **M1** `cron/process/route.ts:47-49` — סימון `processing` לא אטומי מול ה-SELECT של `queued` → פרסום כפול בעומס. הפתרון: UPDATE...WHERE status='queued' RETURNING. `[✅ מאומת בקוד]`
- **M2** `social/oauth/{facebook,tiktok}/route.ts` + callbacks — ה-`state` בלי nonce/חתימה וה-callback לא בודק session → אין הגנת CSRF ל-OAuth. `[סביר]`
- **M3** `scheduler/route.ts:34-42` (PATCH) — `status` מהגוף נכתב בלי ולידציה מול enum → 500 (constraint) או קידום ידני ל-'published'. `[✅ מאומת]`
- **M4** `ideas/generate/route.ts` — אם כל הקריאות נכשלו, `ideas=[]` אבל `deductTokens` עדיין רץ → המשתמש מחויב 8 טוקנים על 0 רעיונות. `[סביר]`
- **M5** `video/transcribe` + `video/render` — קוראים `deductTokens` **בלי** `checkTokenBalance` מוקדם → עבודה בתשלום גם ללא יתרה. `[סביר]`
- **M6** `app/api/admin/stats/route.ts:64-75` — agency מסווג כ-`free_users`, ו-`paying_users=basic+pro` **בלי agency**. סטטיסטיקות שגויות. `[✅ מאומת מול schema]`
- **M7** `auth/register/route.ts:44-46` — `signInWithPassword` לא נבדק לשגיאה; מחזיר `success:true` גם אם ההתחברות נכשלה → משתמש בלי session. `[סביר]`
- **M8** `account/delete/route.ts` — מחיקות רצופות בלי בדיקת שגיאה/טרנזקציה → מחיקה חלקית (GDPR לא אמין); גם ללא confirmation. `[סביר]`
- **M9** `payplus/webhook/route.ts:30-44` — מחזיר `{ok:false}` עם **status 200** על כשל → מסתיר כשלים בניטור. `[סביר]`
- **M10** `lib/tones.ts` + `lib/prompt-vars.ts` — מכסים 7 tones, אך ה-DB constraint מתיר 10 (חסרים educational/marketing/friendly) → פרופיל ישן מזריק id באנגלית לפרומפט. `[✅ מאומת מול constraint]`
- **M11** `proxy.ts:43-45` — matcher לא מחריג `/api` → `auth.getUser()` רץ מיותר על כל קריאת API (latency/עומס). `[✅ מאומת]`
- **M12** `app/dashboard/page.tsx:75,318` — `queueCount` סופר את **כל** הפוסטים (בלי סינון status) → "X פוסטים בתור" מנופח. `[סביר]`
- **M13** `settings/page.tsx:163-244` — ProfileTab שולח רק `{name}`; `jobTitle`/`timezone`/אווטאר נזרקים. `[סביר]`
- **M14** `settings/page.tsx:322,396-433` — NotificationsTab + 2FA קוסמטיים (state מקומי, בלי persistence). `[סביר]`
- **M15** `components/dashboard/Sidebar.tsx:76-80` — `TIER_BADGE` חסר agency → משתמש agency מוצג "חינמי". `[סביר]`
- **M16** `app/dashboard/help/page.tsx:25-51` — מחירים שגויים (Basic ₪79/Pro ₪149) + טוען שהמערכת על "Claude Sonnet / Anthropic" (בפועל Gemini). `[✅ מאומת]`
- **M17** `AnalyticsDashboard.tsx:292-306,515` — כפתור "הפקת דוח PDF" ל-Pro לא עושה כלום; "פוסטים מנצחים" הם 5 האחרונים ללא מדד engagement. `[סביר]`
- **M18** `CommunityInbox.tsx:98-108` — כל תגובה מקובעת ל-`sentiment:'question'`/`human_required`; "הצעות AI" תמיד ריק. triage מזויף (התגובות עצמן אמיתיות). `[סביר]`
- **M19** `GodModeDashboard.tsx:300` — `saveTokens` שולח `{token_balance}` אבל ה-API קורא `tokenBalance` → עריכת טוקנים ב-God Mode נכשלת. `[סביר]`
- **M20** `GodModeDashboard.tsx:316-320` — MRR מקשיח 79/149 בלי agency (לא תואם plans.ts). `[סביר]`
- **M21** `GodModeDashboard.tsx:60-64,412` — TIER_BADGE/מסננים בלי agency. `[סביר]`
- **M22** `app/page.tsx:690-691` — פוטר הנחיתה מקשר ל-`/dashboard/terms`+`/dashboard/privacy` (מוגנים) במקום `/terms`+`/privacy` → מבקר מנותב ל-login. `[✅ מאומת]`
- **M23** `app/login/page.tsx:353` — קישורי תנאים/פרטיות בהסכמת ההרשמה הם `href="#"` (מתים). `[סביר]`
- **M24** `AdminApisClient.tsx:10-21` + `AdminAiClient.tsx` — מנטרים APIs שלא בשימוש (OpenAI/Anthropic/Trends/SerpAPI); מטריקות מקושחות; דגמי claude/gpt. `[סביר]`

---

## 🔵 LOW

- **L1** `publish/route.ts:94` — הצלחה חלקית מסומנת `'published'` (שני ענפי טרינרי זהים) → פוסט שנכשל בחלק מהרשתות מוצג כ"פורסם". `[✅ מאומת]`
- **L2** `social/connect/route.ts` POST — מקבל `oauthToken` מהגוף ושומר → עקיפת OAuth (המשתמש פוגע בעצמו). `[סביר]`
- **L3** `social/oauth/tiktok/callback` — שומר רק access_token (פג ~24ש') בלי refresh_token → פרסום TikTok מתוזמן ייכשל אחרי יממה. `[סביר]`
- **L4** `ideas/save/route.ts` — `category` בלי ולידציה מול value/marketing/vibe. `[סביר]`
- **L5** `lead/route.ts` + `demo-generate/route.ts` — rate-limiter in-memory (`Map`) לא עובד ב-serverless (מתאפס בכל cold-start). `[סביר]`
- **L6** `notifications/send/route.ts` — לא מנקה subscriptions שפגו (410) → הצטברות endpoints מתים. `[סביר]`
- **L7** `lib/web-push.ts:5` — VAPID contact `mailto:admin@socime.app` (הדומיין בפועל socime.co.il). `[✅ מאומת]`
- **L8** `supabase/tokens_rpc.sql:33-45` — `reset_monthly_tokens()` דורס לכל המשתמשים בלי WHERE → יתרות admin/founder (999999) יאופסו ל-1000 ב-1 לחודש. `[✅ מאומת בקוד]`
- **L9** `AdminSearchBar.tsx` — שדה חיפוש גלובלי דקורטיבי (אין onChange/handler). `[סביר]`
- **L10** `login/page.tsx:312` — `minLength={6}` אך placeholder "לפחות 8 תווים" (reset-password דורש 8). `[✅ מאומת]`
- **L11** `CalendarView.tsx:816` + `AnalyticsDashboard.tsx:228` — מסנן סטטוס כולל `'scheduled'` (לא קיים) וחסר `'queued'` → אי אפשר לסנן פוסטים בתור. `[✅ מאומת]`
- **L12** `BillingDashboard.tsx:138-146,464` — `downloadInvoice` יוצר `.txt` שכותרתו "PDF"; StatusBadge מקושח `'paid'` (גם refund יוצג "שולם"). `[סביר]`
- **L13** `components/dashboard/{TimingPanel,BulkUpload,NotificationsPanel}.tsx` — כרטיסים בהירים בתוך דשבורד כהה (עיצוב לא עקבי). `[סביר]`
- **L14** `TimingPanel.tsx:7-29` — פריסט שבת עם המרת TZ שגויה (setHours מקומי → toISOString) → שעה מוסטת. `[סביר]`
- **L15** `app/dashboard/video/page.tsx:8` — מפנה ל-`/login` בעוד שאר הדפים ל-`/?login=required`. `[סביר]`

---

## ⚪ NIT

- **N1** `components/dashboard/BentoCards.tsx` + `components/ImageGenerator.tsx` — **קוד מת** (לא מיובאים בשום מקום). `[סביר]`
- **N2** `lib/tokens.ts:7` — הערה "per batch of 12 ideas" אך מיוצרים 10.
- **N3** `lib/llm.ts` — wrapper מיותר (re-export של gemini.generatePost).
- **N4** `lib/agents.ts:267` — JSDoc "4 versions" אך מוחזרים 3; חסר shape-guard ב-runMultiPlatformAdapter.
- **N5** `app/api/health/route.ts` — בודק env keys של OpenAI/Anthropic שלא קיימים בפרויקט.
- **N6** `app/layout.tsx:43` — Tabler icons מ-CDN חיצוני (jsdelivr) — תלות חיצונית לכל האייקונים.
- **N7** `app/page.tsx` — "© 2025" מקושח בכניסה (הנחיתה משתמשת ב-getFullYear).
- **N8** `CreateStudio.tsx:205` / `ProAgents.tsx:223` — `imgAttempts` מקושח 2; כרטיסי סוכנים לחיצים גם ל-non-Pro (UX).

---

## עדיפות תיקון מומלצת
**גל 1 (חוסם פונקציונליות ליבה):** C1, C2 — לתקן את זרימת התזמון (camelCase + מערך platform). בלעדיהם **פוסטים מתוזמנים לא עובדים כלל**.
**גל 2 (אבטחה/כסף):** C3, H1, H2, H3, H4, H5, H11, H12.
**גל 3 (אמינות מול לקוח):** H8, H9, H10, H15–H18, M16 — נתונים/מחירים שגויים ופיצ'רים מזויפים (קריטי לפני גביית כסף/פיילוט).
**גל 4:** יתר ה-MEDIUM (בעיקר פערי agency + camelCase ב-GodMode).
**גל 5:** LOW/NIT + ניקוי קוד מת.

---

## כיסוי הסריקה
נסרקו **קובץ-קובץ בקריאה מלאה**: כל 56 ה-API routes · כל 18 קבצי `lib/` + קונפיגורציה · כל 34 הדפים · כל 42 הקומפוננטות · כל 22 קבצי ה-SQL. חמישה סוכני QA עברו על התחומים במקביל; ממצאי ה-DB וזרימת התזמון אומתו מול הסכמה החיה של Supabase ומול הקוד.

**מה שלא נבדק לעומק:** רכיבי `components/ui/*` (פרימיטיבים סטנדרטיים של shadcn) — נבדקו כמדגם; תוכן משפטי סטטי ב-TermsContent/PrivacyContent (ללא לוגיקה).

*הערה: המסמך מתעד את המצב נכון ל-2026-07-08. עדכן/מחק ממצאים כשמתקנים.*
