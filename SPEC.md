# SociMe — מסמך איפיון של המצב הקיים בפועל (SPEC)

> מסמך זה מתעד את מה **שממומש בפועל בקוד ובמסד הנתונים** נכון ל-2026-07-08 — לא מה שתוכנן.
> נכתב על סמך קריאה בפועל של קבצים, שאילתות live מול Supabase, ו-grep על כל בסיס הקוד.
> **היכן שלא נפתח קובץ במלואו — צוין במפורש.** אין ניחושים.

---

## 1. מבנה כללי

### ארכיטקטורה
אפליקציית **Next.js 16 (App Router)** מונוליטית — frontend + backend (API Routes) באותו פרויקט, פרוסה ב-**Vercel** (חשבון Hobby). מסד הנתונים והאימות ב-**Supabase** (Postgres מנוהל). ה-AI דרך **Google Gemini**. עברית מלאה, RTL.

```
דפדפן (RTL) ──▶ Next.js App Router (Vercel)
                 ├─ Server Components (דפים) ──▶ Supabase (service client, עוקף RLS)
                 ├─ Client Components (UI) ──▶ fetch ל-/api/*
                 └─ API Routes (/app/api/**) ──▶ Supabase / Gemini / Meta / TikTok / PayPlus / Cloudinary
proxy.ts (middleware) ──▶ שומר על /dashboard, /admin, /onboarding
cron חיצוני (cron-job.org) ──▶ /api/cron/process (כל דקה)
```

### טכנולוגיות בפועל (מ-`package.json`)
| קטגוריה | ספרייה | גרסה |
|---------|--------|------|
| Framework | `next` | 16.2.9 |
| UI | `react` / `react-dom` | 19.2.4 |
| DB/Auth | `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.108 | |
| AI | `@google/generative-ai` | 0.24.1 |
| ניטור שגיאות | `@sentry/nextjs` | 10.60 |
| מדיה | `cloudinary` | 2.10 |
| Push | `web-push` | 3.6.7 |
| עיצוב | `tailwindcss` v4, `@base-ui/react`, `shadcn`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` | |

**הערות דיוק:**
- **אין Stripe** בפועל — התשלומים דרך PayPlus (REST). עם זאת השדה `transactions.stripe_payment_id` והשם `stripe_payment_id` נותרו כשם היסטורי ומשמשים לאחסון `transaction_uid` של PayPlus.
- **אין OpenAI** — Gemini בלבד (`lib/gemini.ts`, `lib/agents.ts`).
- **אין ORM** — גישה ישירה דרך supabase-js.
- הסגנון מעורב: הרבה **inline styles** + Tailwind v4 + מעט רכיבי shadcn/ui (`components/ui/`).

### מבנה תיקיות עיקרי
```
app/            — דפים (App Router) + app/api (56 route.ts)
components/     — dashboard/ (24), admin/ (8), legal/ (3), pricing/, ui/ (shadcn), Onboarding, ImageGenerator
lib/            — 18 קבצי לוגיקה (supabase, gemini, agents, tokens, plans, business, admin, publisher, crypto…)
contexts/       — (תיקייה קיימת; התוכן לא נסרק)
supabase/       — schema*.sql + migrations/ (14 מיגרציות) + setup scripts
proxy.ts        — middleware (שם חדש ב-Next 16)
sentry.*.config.ts, next.config.ts, vercel.json
```

**קבצים שנסרקו לפרק זה:** `package.json`, `next.config.ts`, `proxy.ts`, פלט `find` על `app/`, `components/`, `lib/`, `supabase/`.
**לא נסרק:** תיקיית `contexts/` (לא נפתחה), `public/`.

---

## 2. דפים ומסכים

כל דפי ה-dashboard בנויים באותה תבנית: **Server Component** ששולף `user` + `tier`/`role` דרך `createServiceClient`, ומרנדר **Client Component** מ-`components/`. אומת ב-`app/dashboard/layout.tsx` (שולף `name, tier, role, token_balance`) וב-`app/dashboard/social/page.tsx` (מעביר `tier` ל-`SocialConnect`).

### דפים ציבוריים
| נתיב | מטרה | רכיב/מקור |
|------|------|-----------|
| `/` | דף נחיתה + דמו לכידת לידים | `app/page.tsx` |
| `/login` | הרשמה/כניסה (עובר דרך `/api/auth/register` \| `/api/auth/login`) | `app/login/page.tsx` |
| `/forgot-password` | בקשת איפוס סיסמה | `app/forgot-password/page.tsx` |
| `/auth/reset-password` | קביעת סיסמה חדשה | `app/auth/reset-password/page.tsx` |
| `/terms`, `/privacy` | תקנון + פרטיות ציבוריים | `components/legal/*` |
| `/payment/success`, `/payment/cancel` | חזרה מ-PayPlus | — |

### Onboarding
| `/onboarding` | הקמת תיק עסק ראשוני | `components/Onboarding.tsx` → `/api/onboarding` |

### Dashboard (מוגן)
| נתיב | מטרה | רכיב מרכזי |
|------|------|-----------|
| `/dashboard` | בית — סטטיסטיקות + פעולות מהירות | `app/dashboard/page.tsx` (שולף `social_tokens`, `scheduler`) |
| `/dashboard/create` | יצירת פוסט עם AI | `CreateStudio.tsx` |
| `/dashboard/ideas` | אנליטיקס (ניתוח פוסטים) | `AnalyticsDashboard.tsx` |
| `/dashboard/queue` | תור/לוח שנה + עריכה inline + פרסום עכשיו | `CalendarView.tsx` |
| `/dashboard/social` | חיבור רשתות (OAuth) | `SocialConnect.tsx` |
| `/dashboard/business` | תיק עסק / פורטפוליו | `BusinessPortfolio.tsx` |
| `/dashboard/community` | תיבת תגובות מ-FB/IG | `CommunityInbox.tsx` |
| `/dashboard/timing` | זמנים אופטימליים + חסימות | `TimingPanel.tsx` |
| `/dashboard/bulk` | העלאה מרובה | `BulkUpload.tsx` |
| `/dashboard/agents` | סוכני AI (Pro) | `ProAgents.tsx` |
| `/dashboard/video` | עורך וידאו | `VideoEditor.tsx` |
| `/dashboard/bank` | בנק רעיונות | `IdeasBank.tsx` |
| `/dashboard/notifications` | התראות | `NotificationsPanel.tsx` |
| `/dashboard/settings` | הגדרות + סיסמה + הזמנת חבר צוות | `app/dashboard/settings/page.tsx` |
| `/dashboard/profile` | פרופיל | — |
| `/dashboard/upgrade` | שדרוג מסלול | `PricingPlans.tsx` |
| `/dashboard/help` | עזרה/FAQ | — |
| `/dashboard/terms`, `/privacy` | עטיפות דקות לתוכן המשפטי | `components/legal/*` |

### Admin (מוגן ל-admin/founder)
| `/admin` | God-mode dashboard | `GodModeDashboard.tsx` |
| `/admin/users` | ניהול משתמשים (tier/tokens/role/status) | `AdminUsersClient.tsx` |
| `/admin/leads` | תיבת לידים + ייצוא CSV | `AdminLeadsClient.tsx` |
| `/admin/billing` | חיובים | `AdminBillingClient.tsx` |
| `/admin/ai` | ניהול system prompts | `AdminAiClient.tsx` |
| `/admin/apis` | סטטוס אינטגרציות | `AdminApisClient.tsx` |
| `/admin/logs` | לוגים | `AdminLogsClient.tsx` |

**נסרקו:** `app/dashboard/layout.tsx`, `app/dashboard/social/page.tsx`, רשימת כל `page.tsx`, רשימת כל הרכיבים.
**לא נפתחו במלואם:** רוב קבצי `page.tsx` הפנימיים — תוארו לפי הנתיב + הרכיב שהם מרנדרים + התבנית האחידה. `/dashboard/bank` — מטרתו לא ודאית.

---

## 3. יכולות ופיצ'רים

| פיצ'ר | מצב | קבצים |
|-------|-----|-------|
| **יצירת פוסט (AI)** | ✅ עובד. Gemini 2.5-flash, JSON `{text, hashtags}`, מזריק פרטי עסק (`prompt-vars`), מנכה 10 טוקנים | `lib/gemini.ts`, `app/api/generate`, `CreateStudio.tsx` |
| **יצירת תמונה (AI)** | ✅ עובד. `gemini-2.0-flash-exp`, מחזיר base64 data-URL, 25 טוקנים + מכסה חודשית | `lib/gemini.ts` (`generateImage`), `app/api/generate-image`, `lib/image-quota.ts` |
| **בנק רעיונות** | ✅ עובד. 10 רעיונות לפי קטגוריה (value/marketing/vibe), 8 טוקנים | `app/api/ideas/*`, `IdeasBank.tsx` |
| **תזמון ופרסום** | ✅ עובד (Meta). מחזור: draft→queued→processing→published/failed + paused. retry עם back-off (5/10/20 דק׳, מקס 3) | `app/api/scheduler/*`, `lib/publisher.ts`, `app/api/cron/process` |
| **פרסום עכשיו** | ✅ עובד | `app/api/publish` |
| **חיבור רשתות (OAuth)** | חלקי — ראה §6. FB/IG + TikTok מחווטים; **FB חסום ב-live** (Login-for-Business דורש config_id) | `SocialConnect.tsx`, `app/api/social/oauth/*` |
| **תיבת קהילה** | ✅ עובד (אמיתי) — מושך תגובות FB/IG דרך Graph API | `app/api/community/comments`, `CommunityInbox.tsx` |
| **זמנים אופטימליים** | ✅ עובד, אבל **היוריסטיקה סטטית** (slots קבועים לשוק ישראלי) — לא ML | `app/api/timing/suggest` |
| **חסימות (blackout)** | ✅ עובד | `app/api/timing/blackout` |
| **סוכני AI (Pro)** | ✅ מומשו 3: מתחרים, קופי ממומן, אומני-צ'אנל. Pro-gated + ניכוי טוקנים | `lib/agents.ts`, `lib/agentRoute.ts`, `app/api/agents/*` |
| **עורך וידאו** | חלקי. Cloudinary + AssemblyAI; **מוזיקה = placeholder** (`video:sample`, יש TODO) | `app/api/video/*`, `VideoEditor.tsx` |
| **ריבוי עסקים (Agency)** | ✅ עובד. עד 5 עסקים, `active_business_id` | `lib/business.ts`, `BusinessSwitcher.tsx` |
| **מנוי + חידוש אוטומטי** | ⚠️ קוד קיים, **לא פעיל** — מפתחות PayPlus placeholder + שדות מסומנים `VERIFY` | `app/api/payplus/*`, `app/api/cron/renewals` |
| **התראות (in-app + Web Push)** | ✅ קוד קיים (VAPID) | `app/api/notifications/*`, `lib/web-push.ts` |
| **לכידת לידים** | ✅ עובד (נשמר תמיד ל-DB; מייל best-effort — לא פעיל, ראה §6) | `app/api/lead`, `AdminLeadsClient.tsx` |
| **דמו נחיתה** | ✅ עובד | `app/api/demo-generate` |
| **מכסת תמונות** | ✅ תוקן (2026-07-08): נוסף `agency: 500` ל-`IMAGE_QUOTA` | `lib/image-quota.ts` |

**נסרקו:** כל הקבצים שבטבלה. **לא נסרקו במלואם:** רכיבי ה-Client המרכזיים (`CreateStudio`, `CalendarView` וכו') — קיומם ותפקידם ודאי מהנתיבים וה-API, אך ה-JSX הפנימי לא נקרא כאן.

---

## 4. API Endpoints

56 קבצי `route.ts`. סוגי הגנה: **סשן** (`auth.getUser`), **אדמין** (`getAdminContext`/`requireAdmin` = admin+founder), **cron** (`CRON_SECRET` bearer), **webhook** (חתימת HMAC), **OAuth callback** (state), **ציבורי**.

### יצירה / AI
| Method + Path | הגנה | תפקיד |
|---|---|---|
| POST `/api/generate` | סשן | פוסט טקסט (10 טוקנים) |
| POST `/api/generate-image` | סשן | תמונה (25 טוקנים + מכסה) |
| POST `/api/ideas/generate`, GET `/api/ideas`, POST `/api/ideas/save` | סשן | בנק רעיונות |
| POST `/api/demo-generate` | **ציבורי** | דמו נחיתה |
| POST `/api/agents/competitor` \| `/ad-copy` \| `/adapt` | **סשן + Pro** (דרך `runProAgent`) | סוכני AI |

### תזמון / פרסום
| POST/PATCH `/api/scheduler`, PATCH `/api/scheduler/[id]`, POST `/api/scheduler/pause-all` | סשן | ניהול תור |
| POST `/api/publish` | סשן | פרסום מיידי |
| GET `/api/cron/process` | **cron** | מעבד פוסטים בתור |
| GET `/api/cron/reset-tokens` | **cron** | איפוס חודשי |
| GET `/api/cron/renewals` | **cron** | חידוש מנוי (PayPlus — לא פעיל) |

### רשתות / קהילה / תזמון
| GET/POST `/api/social/connect`, DELETE `/api/social/disconnect` | סשן | סטטוס/ניתוק |
| GET `/api/social/oauth/facebook` \| `/tiktok` | סשן | התחלת OAuth |
| GET `/api/social/oauth/facebook/callback` \| `/tiktok/callback` | **state** | קליטת token + שמירה מוצפנת |
| GET `/api/community/comments`, POST `/api/community/reply` | סשן | תגובות FB/IG |
| GET `/api/timing/suggest`, GET/POST/DELETE `/api/timing/blackout` | סשן | זמנים/חסימות |

### חשבון / עסק / טוקנים
| GET/PATCH `/api/account/profile`, POST `/api/account/password`, DELETE `/api/account/delete` | סשן | חשבון (מחיקה = GDPR) |
| GET `/api/business/list`, POST `/api/business/create`, POST `/api/business/switch` | סשן | ריבוי עסקים |
| GET `/api/tokens/balance` | סשן | יתרת טוקנים (live) |
| POST `/api/onboarding` | סשן | שמירת תיק עסק |

### תשלומים / לידים / התראות / וידאו
| POST `/api/payplus/checkout` | סשן | יצירת דף תשלום PayPlus |
| POST `/api/payplus/webhook` | **HMAC** (`x-payplus-signature`) | הפעלת מנוי + idempotency |
| POST `/api/lead` | **ציבורי** (rate-limit) | שמירת ליד |
| GET/POST/PATCH `/api/notifications/inbox`, POST/DELETE `/api/notifications/subscribe`, POST `/api/notifications/send` | סשן* | התראות |
| POST `/api/video/transcribe` (+GET), POST `/api/video/render`, POST `/api/video/sign-upload`, POST `/api/bulk-upload` | סשן | וידאו/העלאות |

### אימות / אדמין / בריאות
| POST `/api/auth/register`, POST `/api/auth/login` | **ציבורי** | הרשמה (auto-confirm) / כניסה |
| GET `/api/auth/callback` | **OAuth (Google)** | קליטת session מגוגל |
| PATCH `/api/admin/users`, GET `/api/admin/stats`, GET/POST `/api/admin/system-prompts`, POST `/api/admin/test-prompt`, POST `/api/admin/impersonate` | **אדמין** | ניהול |
| GET `/api/health` | לא נקרא במלואו | בדיקת בריאות/env |

**יתומים/הערות:**
- אין endpoints יתומים בולטים שנותרו (ה-`/api/scheduler/approve` הישן נמחק בסשן קודם).
- `/api/notifications/send` — זוהה סימן אימות אחד; **הקובץ לא נקרא במלואו** → סוג ההגנה המדויק לא ודאי.
- `/api/health` — **לא נקרא** → תוכנו לא ודאי.

**נסרקו:** grep על methods + auth-signals לכל 56; נקראו במלואם: `payplus/checkout`, `payplus/webhook`, `community/comments`, `timing/suggest`, `social/oauth/facebook(+callback)`, `social/oauth/tiktok`, `publish`, `admin/users`, וכן (בסשן) `generate`, `onboarding`, `auth/register`, `auth/callback`, `cron/process`, `lead`.

---

## 5. מודל נתונים (Supabase — live)

נשלף ישירות מ-`information_schema` של הפרויקט `pzepqsqnxaeqwiuvbmzd`. **13 טבלאות ב-`public`, כולן עם RLS מופעל.**

| טבלה | שדות מרכזיים | RLS policies |
|------|--------------|:---:|
| **users** | `id`(FK auth.users), `email`, `name`, `plan`, `tier`, `token_balance`, `role`, `status`, `active_business_id`, `subscription_plan/cycle/expires_at`, `renewal_failures`, `payplus_token_uid`, `card_brand/last4`, `posting_paused`, `image_count_this_month`, `next_reset_date`, `google_id`, `pin_hash` | 2 |
| **business_profiles** | `user_id`, `business_name`, `raw_description`, `parsed_system_prompt`, `tone_of_voice`, `phone/address/operating_hours`, `company_id`, `website`, `instagram/facebook/linkedin/tiktok`, `target_audience`, `unique_value` | 2 |
| **social_tokens** | `user_id`, `platform`, `encrypted_oauth_token`, `scopes[]`, `expires_at`, `extra_data`(jsonb: page_id/ig_account_id/open_id) | 2 |
| **scheduler** | `user_id`, `content_text`, `hashtags`, `platform[]`, `status`, `scheduled_at/published_at`, `meta_post_id`, `content_type`, `source`, `payload_url`, `caption`, `attempt_count`, `next_retry_at` | 2 |
| **saved_ideas** | `user_id`, `idea_text`, `category`, `liked`, `used` | 2 |
| **token_ledger** | `user_id`, `tokens_used`, `api_cost_usd`, `action_type`, `post_id` | 2 |
| **transactions** | `user_id`, `transaction_type`, `amount_paid_ils`, `stripe_payment_id`(=PayPlus uid), `tokens_granted` | 2 |
| **blackout_periods** | `user_id`, `start/end_datetime`, `label` | 2 |
| **image_usage_log** | `user_id`, `created_at` | 2 |
| **notifications** | `user_id`, `title`, `body`, `url`, `icon`, `read` | 2 |
| **push_subscriptions** | `user_id`, `endpoint`, `keys`(jsonb) | 2 |
| **leads** | `email`, `pain_point`, `generated_post`, `source`, `emailed` | **0** |
| **system_prompts** | `key`, `content`, `updated_at`, `updated_by` | **0** |

### קשרים
כל הטבלאות תלויות ב-`users.id` (FK, `ON DELETE CASCADE`), ש-FK ל-`auth.users`. `users.active_business_id` → `business_profiles.id`. `social_tokens` UNIQUE(user_id, platform).

### Constraints (enums) — כפי שקיימים בפועל
- `users.tier`: **free, basic, pro, agency**
- `users.plan`: **free, pro** ← *(ישן/חופף ל-tier)*
- `users.role`: **user, editor, admin, founder**
- `users.status`: active, suspended, deleted
- `scheduler.status`: draft, **pending_approval**, queued, **processing**, published, failed, paused
- `social_tokens.platform`: instagram, facebook, tiktok
- `transactions.transaction_type`: subscription, renewal, topup, refund
- `token_ledger.action_type`: generate_post, generate_image, generate_ideas, onboarding, video_transcribe, video_render, agent_competitor, agent_ad_copy, agent_adapt, admin_impersonate, video_ideas, moderation, other
- `business_profiles.tone_of_voice`: professional, warm, funny, serious, direct, inspiring, casual, educational, marketing, friendly

### פערי schema↔קוד
- **`leads` ו-`system_prompts`: RLS מופעל אך 0 policies** → נגישים רק דרך service-role (מכוון: לידים/prompts מנוהלים בשרת בלבד).
- **`users.plan` מיותר** — הקוד עובד עם `tier`; `plan` נותר משדה ישן (free/pro) ולא בשימוש מהותי.
- **`stripe_payment_id`** — שם היסטורי, מאחסן `transaction_uid` של PayPlus.
- `token_ledger.action_type` כולל ערכים ישנים (`video_ideas`, `moderation`, `other`) שכנראה כבר לא נכתבים.
- `business_profiles.linkedin` — **בשימוש** (טופס `BusinessPortfolio` + onboarding שומרים URL לינקדאין כפרט עסק). רק ה*פרסום* ללינקדאין הוסר, לא איסוף הפרט — **אינה יתומה**.
- הסכמות בקבצי `supabase/schema.sql` / `schema_phase1.sql` **מיושנות** לעומת ה-DB החי (למשל enum הסטטוס הישן `draft/scheduled/published/failed`) — ה-DB החי הוא מקור האמת.

**נסרקו:** live `information_schema` (טבלאות+עמודות), `pg_constraint`, `pg_policies`, `supabase/schema.sql`, `supabase/schema_phase1.sql`.
**לא נסרקו במלואן:** יתר קבצי ה-SQL ב-`supabase/` (setup scripts, יתר המיגרציות) — נסמכתי על ה-DB החי כמקור אמת.

---

## 6. אינטגרציות חיצוניות

| שירות | מטרה | מצב בפועל |
|-------|------|-----------|
| **Google Gemini** | טקסט (2.5-flash), תמונה (2.0-flash-exp), 3 סוכנים | ✅ ממומש ועובד. מפתח אמיתי. |
| **Supabase** | Postgres + Auth | ✅ ממומש (SSR client + service client). |
| **Meta (Facebook + Instagram)** | OAuth + פרסום + תגובות | ⚠️ מחווט ומאומת ברמת ה-redirect. **חסום ב-live**: האפליקציה מסוג *Facebook Login for Business* ולכן ה-flow הקלאסי מבוסס-scope נדחה ("URL blocked") — נדרש `config_id`. מפתחות אמיתיים. פרסום תוקן להשתמש ב-`page_id` per-user (`social_tokens.extra_data`) ולא ב-`META_PAGE_ID` הקבוע. |
| **TikTok** | OAuth (PKCE) + פרסום וידאו (Content Posting API, PULL_FROM_URL) | ✅ מחווט ומאומת חי (307→tiktok עם client_key). מצב **Sandbox** (לפני App Review). דורש `content_type='video'`. |
| **PayPlus** | סליקה + חידוש מנוי | ⚠️ **קוד קיים, לא פעיל**. מפתחות = placeholder. שדות מסומנים `VERIFY` (טרם אומתו מול תיעוד רשמי): `create_token`, `charge_method:1`, `token_uid`, חתימת `x-payplus-signature` (HMAC-SHA256 hex), נתיב חיוב הטוקן ב-renewals. |
| **Cloudinary** | אחסון/עיבוד וידאו + חתימת העלאה | ✅ מפתחות אמיתיים. מוזיקת רקע = placeholder (TODO). |
| **AssemblyAI** | תמלול וידאו | ✅ מפתח אמיתי (`/api/video/transcribe`). |
| **Web Push (VAPID)** | התראות דחיפה | ✅ מפתחות אמיתיים. |
| **Sentry** | ניטור שגיאות | ✅ מוגדר (`next.config.ts` + `sentry.*.config.ts`). |
| **Resend** | מיילים יוצאים (התראת ליד) | ❌ **לא בשימוש**. Wix DNS לא תומך ב-MX על תת-דומיין → אי אפשר לאמת. הקוד best-effort; לידים נשמרים ל-DB בכל מקרה. |
| **Zoho Mail** | תיבות דואר של החברה (חיצוני לאפליקציה) | ✅ פעיל (`hello@socime.co.il` + aliases) — לא חלק מהקוד. |

**נסרקו:** `lib/gemini.ts`, `lib/agents.ts`, `lib/publisher.ts`, `app/api/payplus/*`, `app/api/social/oauth/*`, `app/api/community/comments`, `lib/image-quota.ts`.

---

## 7. ניהול משתמשים והרשאות

### אימות (Auth)
- **Supabase Auth** — אימייל+סיסמה + **Google OAuth** (`/api/auth/callback` מחליף code ל-session ומנתב לפי קיום `business_profiles`).
- **אישור-מייל מופעל** בפרויקט, אבל `/api/auth/register` עוקף אותו: `admin.createUser({ email_confirm: true })` + `signInWithPassword` בשרת → session מיידי.
- איפוס סיסמה דרך Supabase (`/forgot-password` → `/auth/reset-password`).

### תפקידים (`users.role`)
`user` / `editor` / `admin` / `founder`. הגנת אדמין ב-`lib/admin.ts`: `requireAdmin()` (דפים, מפנה) ו-`getAdminContext()` (API) — שניהם מתירים **admin + founder**. `founder` **לא ניתן להקצאה דרך ה-UI** (`ASSIGNABLE_ROLES = user/editor/admin`), ותפקיד/סטטוס של חשבון founder ניתנים לשינוי רק ע"י founder אחר (`app/api/admin/users`).

### מסלולים (`users.tier`)
free / basic / pro / agency. Pro-gating: סוכני AI ו-TikTok (`PRO_TIERS = ['pro','agency']` ב-`agentRoute.ts` ו-`SocialConnect.tsx`). מכסות: טוקנים (`lib/plans.ts`), תמונות (`lib/image-quota.ts` — **חסר agency**), עסקים (`lib/business.ts`: agency=5, שאר=1).

### מה מוגן ומה פתוח
- **`proxy.ts`** מגן על `/dashboard`, `/admin`, `/onboarding` (redirect ל-`/login` ללא user); מפנה מחוברים מ-`/login`.
- **RLS** על כל 13 הטבלאות (policy "own row" לכולן פרט ל-leads/system_prompts שהם service-role-only).
- **API**: session ברוב; אדמין ב-`/api/admin/*`; cron ב-Bearer `CRON_SECRET`; webhook ב-HMAC; OAuth callbacks ב-state.
- **ציבורי**: `/`, `/login`, `/terms`, `/privacy`, `/api/lead`, `/api/demo-generate`, `/api/auth/*`.
- הצפנת טוקני OAuth ב-`lib/crypto.ts` (AES-256-GCM) לפני שמירה ב-`social_tokens`.

**נסרקו:** `lib/admin.ts`, `lib/agentRoute.ts`, `lib/business.ts`, `lib/plans.ts`, `lib/image-quota.ts`, `proxy.ts`, `app/api/admin/users`, `app/dashboard/layout.tsx`, `app/api/payplus/checkout`.
**לא נסרק:** `lib/crypto.ts` (קיומו ותפקידו ודאי מ-imports, לא נקרא כאן), `/api/auth/login` (לא נקרא במלואו).

---

## 8. פערים ובעיות שזוהו

### באגים/סיכונים
1. ~~**`IMAGE_QUOTA` חסר `agency`**~~ → **✅ תוקן (2026-07-08)**: נוסף `agency: 500`.
2. **Meta Login-for-Business** — הקוד שולח flow קלאסי מבוסס-scope; האפליקציה דורשת `config_id`. **חוסם חיבור FB בפועל** (בטיפול).
3. **PayPlus לא מאומת** — כל שדות ה-`VERIFY` (checkout/webhook/renewals) הם הנחות שלא נבדקו מול תיעוד. חיוב אמיתי עלול להיכשל.
4. ~~**מוזיקת וידאו = placeholder**~~ → **✅ תוקן (2026-07-08)**: משתמש ב-`musicTrack` האמיתי שנשלח במקום `video:sample` קשיח.

### חוסר עקביות בין שכבות
5. **`users.plan` מול `users.tier`** — **✅ תוקן (2026-07-08)**: היה באג — כמה דפים (AnalyticsDashboard, IdeasBank, BillingDashboard, settings, admin/billing) עשו gating על `users.plan`, אבל אף אחד לא כותב אליו (ה-webhook מעדכן `tier`/`subscription_plan`) → נשאר תמיד `free`, ומשלמים הוצגו/נחסמו כ-free. כל הצרכנים הועברו ל-`tier`. `users.plan` נותר בסכמה כשדה ישן לא-בשימוש (אפשר להסיר בעתיד במיגרציה).
6. **`stripe_payment_id`** — שם מטעה (אין Stripe; זה PayPlus uid).
7. ~~`business_profiles.linkedin` יתומה~~ — **הובהר**: אינה יתומה; בשימוש ב-`BusinessPortfolio` + onboarding (URL לינקדאין כפרט עסק).
8. **enum בקבצי `schema.sql`/`schema_phase1.sql` מיושן** לעומת ה-DB החי (סטטוס scheduler, tone_of_voice, platform).
9. **`token_ledger.action_type`** כולל ערכים ישנים שכנראה לא נכתבים (`video_ideas`, `moderation`, `other`).
10. **הערות לא עקביות בטוקנים**: `lib/tokens.ts` כותב "batch of 12 ideas" אך `lib/gemini.ts` מייצר 10.

### קוד מת / מסמכים מיושנים
11. **`README.md` מיושן** — מזכיר `PaywallForm.tsx` ("Stripe placeholder") שנמחק, ומבנה ישן.
12. עמודי `supabase/*.sql` הישנים (schema.sql וכו') כבר לא משקפים את ה-DB — כדאי לסמן כ-legacy או לרענן.

### לא נבדק (במפורש)
- תיקיית `contexts/` — לא נפתחה.
- רוב קבצי `page.tsx` הפנימיים וה-JSX של רכיבי ה-Client — לא נקראו שורה-שורה.
- `/api/health`, `/api/notifications/send`, `/api/auth/login` — לא נקראו במלואם (סוג ההגנה המדויק לא ודאי בחלקם).
- `/dashboard/bank` — מטרתו לא ודאית.
- יתר קבצי ה-SQL ב-`supabase/` (setup/מיגרציות ישנות) — לא נקראו; נסמכתי על ה-DB החי.
- בדיקה בפועל של ה-JSX ב-`AnalyticsDashboard`/`BillingDashboard` (לפי סשן קודם נוקו מנתוני-דמו, לא אומת מחדש כאן).

**קבצים שנסרקו לפרק זה:** grep על `TODO|FIXME|VERIFY|Math.random|placeholder|mock` בכל הקוד; `lib/image-quota.ts`, `lib/tokens.ts`, `lib/plans.ts`, `app/api/video/render` (דרך grep), `app/api/payplus/*`, `README.md` (שורה 60 דרך grep).

---

## נספח — סיכום מצב אינטגרציות להשקה
| רכיב | מוכן? |
|------|:---:|
| אפליקציה חיה (`socime.co.il` + HTTPS) | ✅ |
| Scheduler (cron חיצוני) | ✅ |
| Gemini / Supabase / Cloudinary / AssemblyAI / Sentry / Push | ✅ |
| TikTok | ✅ (Sandbox; App Review בהמשך) |
| Meta | ⚠️ (חסום — config_id) |
| PayPlus | ❌ (עוסק פטור + אימות שדות) |
| Resend (מייל יוצא) | ❌ (נדחה) |

*מסמך זה נוצר אוטומטית מסריקת קוד בפועל. עדכן אותו כשמשתנה המימוש.*
