# SociMe — App Review Package (Meta + TikTok)

מטרה: לעבור App Review **פעם אחת** כדי שכל לקוח (לא רק Testers) יוכל לחבר את הרשתות ולפרסם.
ההצדקות שיש להדביק לטופס של Meta/TikTok כתובות **באנגלית** (הבודקים קוראים אנגלית) — הטקסט העברי הוא הנחיה בלבד.

גרסה: 2026-07-18. מבוסס על הקוד בפועל (`app/api/social/oauth/*`, `lib/publisher.ts`).

---

## 0. דרישות מקדימות (חייבות להיות מסומנות לפני הגשה)

| # | דרישה | סטטוס נוכחי | פעולה |
|---|-------|-------------|-------|
| 1 | **Business Verification** של EDRI GROUP מול Meta (מסמכי עסק + ח.פ) | ❌ דורש ישות רשומה | לפתוח עוסק/חברה ולאמת ב-Meta Business Settings → Security Center |
| 2 | **App Mode = Live** (לא Development) | כנראה Development (זו השגיאה שהלקוח קיבל) | Meta App Dashboard → למעלה → App Mode → Live |
| 3 | Privacy Policy URL + Terms URL + Data Deletion URL ציבוריים | ✅ `socime.co.il/privacy`, `/terms` (אומת) | — |
| 4 | Valid OAuth Redirect URI | ✅ `https://socime.co.il/api/social/oauth/facebook/callback` | — |
| 5 | App Icon (1024×1024) + Category | לוודא | להשלים בהגדרות הבסיסיות |

> ⚠️ **הפקק המרכזי:** שלב 1 (Business Verification) דורש EDRI GROUP רשום עם ח.פ — **אותו דבר** שדרוש לעוסק פטור (PayPlus) ולישות המשפטית בתקנון. פתיחת העוסק משחררת את שלושתם.

---

## 1. Meta — הרשאות + הצדקות מוכנות-להדבקה

לכל הרשאה: מה היא, מה SociMe עושה איתה בפועל (מקום בקוד), והטקסט להדביק ("Tell us how you'll use…").

### `pages_show_list`
**בשימוש:** מציג למשתמש את רשימת עמודי הפייסבוק שלו כדי שיבחר איזה עמוד SociMe ינהל.
**Paste:**
> SociMe lets a small-business owner connect their own Facebook Page so our scheduler can publish content they approved. We use `pages_show_list` only to display the list of Pages the person admins, so they can select which Page to connect. We do not access Pages they don't manage.

### `pages_read_engagement`
**בשימוש:** קורא נתוני-בסיס של העמוד הנבחר (זהות/הרשאות) לפני פרסום.
**Paste:**
> After the user selects a Page, SociMe reads basic Page information (name, id, and access status) to confirm the connection and label it in the dashboard. We use `pages_read_engagement` solely to read the selected Page's own data — never other Pages.

### `pages_manage_posts`  ← **קריטי לפרסום בפייסבוק**
**בשימוש:** `lib/publisher.ts` → `POST {pageId}/feed` עם `message`. זה מה שמפרסם את הפוסט.
**Paste:**
> SociMe publishes text and media posts to the user's own Facebook Page on their behalf, but only after the user has created and explicitly approved the content inside SociMe. We use `pages_manage_posts` to publish those approved, user-authored posts to the Page's feed via the `/{page-id}/feed` endpoint. Nothing is posted without the user's approval.

> ⚠️ **בדוק:** לפי ההיסטוריה, `pages_manage_posts` **לא הופיע** ב-Configuration של Meta (דרש Advanced Access). בלעדיו — פרסום לעמוד פייסבוק ייכשל. יש להוסיף אותו ל-Configuration ולכלול אותו בהגשה.

### `instagram_basic`
**בשימוש:** גישה לחשבון האינסטגרם-Business המקושר לעמוד (`{igId}`).
**Paste:**
> SociMe accesses the Instagram Business account linked to the user's connected Facebook Page. We use `instagram_basic` to identify that Instagram account and confirm it is available for publishing.

### `instagram_content_publish`  ← **קריטי לפרסום באינסטגרם**
**בשימוש:** `lib/publisher.ts` → `POST {igId}/media` (container עם caption + image/video) → `POST {igId}/media_publish`.
**Paste:**
> SociMe publishes photos and videos that the user created and approved in SociMe to their own Instagram Business account, using the standard two-step Content Publishing API (`/media` then `/media_publish`). We use `instagram_content_publish` only for content the user has explicitly approved.

### `business_management`  ← **שקול להסיר**
**בשימוש:** לא נדרש ל-flow הבסיסי (רשימת עמודים + פרסום). נמצא ב-Configuration.
**המלצה:** אם הבודקים מחברים עמוד שהם אדמינים ישירים שלו (לא דרך Business Manager) — **הסר את ההרשאה מה-Configuration.** פחות הרשאות = ביקורת מהירה וקלה יותר. השאר רק אם לקוחות אמיתיים מנהלים עמודים דרך Business Manager.

---

## 2. TikTok — הרשאות + הצדקות

### `user.info.basic`
**Paste:**
> SociMe uses `user.info.basic` to identify the TikTok account the user connects and to display it (username/avatar) in their dashboard so they know which account is linked.

### `video.publish`  ← דורש audit נפרד של TikTok
**בשימוש:** `lib/publisher.ts` → Content Posting API, `source: PULL_FROM_URL`, `video_url`.
**Paste:**
> SociMe publishes videos the user created and approved in SociMe to their own TikTok account via the Content Posting API (PULL_FROM_URL). Publishing happens only for content the user explicitly approved and scheduled.

> ⚠️ TikTok דורש **סרטון דמו** של ה-flow המלא + לעיתים audit ידני לפני ש-`video.publish` נפתח לפרודקשן. אותו סרטון מהסעיף הבא משרת גם את TikTok.

---

## 3. תסריט סרטון הדמו (Screencast)

Meta ו-TikTok רוצים לראות **את ההרשאה בשימוש אמיתי, בהקשר**. הקלט מסך אחד רציף (60-120 שניות), באנגלית או עם כתוביות אנגלית, שמראה **בדיוק** את הרצף הבא. הקלט עם חשבון אמיתי שהוא Admin/Tester (עובד גם לפני אישור).

**Setup לפני הקלטה:** התחבר ל-SociMe, שהעמוד/IG/TikTok עדיין **לא** מחוברים (כדי להראות את החיבור מאפס).

1. **הקשר (5 ש'):** מסך הבית של הדשבורד — הראה שזה כלי לניהול סושיאל לעסק. אמור בקול/כתובית: *"SociMe helps a small business schedule and publish social content they created."*
2. **התחלת חיבור (10 ש'):** עבור ל"חיבור לרשתות" → לחץ "התחבר" ליד Facebook. → מסך ה-OAuth של Facebook נפתח.
3. **הסכמה + בחירת עמוד (15 ש'):** אשר את ההרשאות → **הראה את מסך בחירת העמוד** (זה מדגים `pages_show_list`) → בחר עמוד → חזרה ל-SociMe עם "מחובר". (מדגים `pages_read_engagement`, `instagram_basic`.)
4. **יצירת תוכן (15 ש'):** צור פוסט (טקסט + תמונה/וידאו) → הראה שהמשתמש כותב/מאשר אותו. הדגש: *"the user creates and approves this content."*
5. **פרסום (20 ש'):** לחץ "פרסם עכשיו" / הצג תזמון → הראה הצלחה. → **פתח בטאב אחר את עמוד הפייסבוק/אינסטגרם עצמו והראה שהפוסט עלה.** (זה הרגע הקריטי — מדגים `pages_manage_posts` + `instagram_content_publish`.)
6. **TikTok (15 ש'):** חזור על 2-3-5 עבור TikTok (חיבור → פרסום וידאו → הצגת הווידאו בחשבון TikTok). מדגים `video.publish`.

**כללי זהב:**
- הראה **פרסום שמצליח ומופיע בפועל** ברשת — בלי זה Meta דוחה.
- הדגש בכל שלב שהמשתמש **יצר ואישר** את התוכן (Meta רגישה לפרסום אוטומטי לא-מאושר).
- אל תראה הרשאות שאתה לא מבקש. אל תדלג על מסך ההסכמה.
- וידאו איכותי, איטי, ברור. בלי חיתוכים חדים.

---

## 4. סדר פעולות מומלץ

1. **עכשיו:** פיילוט סגור עם 3-5 Testers (App roles → Testers). לא מחכה לביקורת.
2. **במקביל:** פתיחת עוסק/חברה → Business Verification.
3. הסר `business_management` מה-Configuration אם לא נחוץ; ודא ש-`pages_manage_posts` **כן** ב-Configuration.
4. העבר App Mode → Live.
5. הקלט את סרטון הדמו (סעיף 3) — ממילא תעבור את ה-flow עם הבודקים.
6. הגש לביקורת עם ההצדקות (סעיף 1-2) + הסרטון.
7. TikTok: הגש audit עם אותו סרטון.

**אחרי אישור:** האישור הידני של Testers מתייתר — כל לקוח יוכל לחבר ולפרסם.
