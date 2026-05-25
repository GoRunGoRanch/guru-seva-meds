# Guru Seva Meds

A simple, mobile-first web app the nationwide seva team uses to track medications and therapies given to Guru Maharaj. Replaces the shared Google Sheet with real-time status, an audit trail, and unmissable overdue alerts.

Built on **Next.js 14 + Supabase + Tailwind**, deployed to **Vercel** — same pattern as kneetie.mobi.

## Phase I scope

- Two roles: **servant** (view + Mark as Given) and **doctor** (everything + Manage list + Import).
- One main screen for servants — every dose of the day, colour-coded:
  - 🔴 **Red** = overdue (was due, not yet given). Sorted to the top. Banner at top of screen counts them.
  - 🟢 **Green** = given today, with timestamp + servant's name.
  - ⚪ **Grey** = upcoming (not yet due).
- **Frequency is enforced by timings.** A med with frequency = TWICE must have exactly 2 scheduled times, or it's rejected on save/import. Each scheduled time becomes its own row on the dashboard.
- **"Today is a dialysis day" toggle** at the top — switches displayed dosage/times for any med that has a dialysis-day value set. Synced live across all servants. Modafinil is intentionally not in the seed list; add it via Manage → Add medication whenever it comes back.
- **Real-time** — when one servant marks given, everyone sees it within ~1 second.
- **Location captured** with each Mark as Given (one-time browser prompt, can be denied without blocking).
- **Magic-link login** — servant types their email, clicks the link in the email, they're in. No passwords.
- **Shared gate password in front of everything** — the public can't even see the login form. One password (currently `NitaiKripa`) is typed once per device, then the per-user magic link handles "who did what." Stored in `APP_GATE_PASSWORD`; remembered for 30 days via an httpOnly cookie.
- **In-app timezone setting** — Guru Maharaj travels. Every "5:15 AM" dose is interpreted in whichever timezone is currently active. Any doctor can flip it from **Manage → Settings** in 5 seconds (e.g. Dallas → Atlanta) and the change is live for everyone immediately. No redeploy.

---

## Part 1 — Set up Supabase (the backend)

1. Go to <https://supabase.com> → **Sign up** (free).
2. **New project** → name it `guru-seva-meds` → choose the region closest to most servants (Singapore or Mumbai for India). Save the database password somewhere safe.
3. Wait ~2 minutes for the project to provision.
4. In the left sidebar, click **SQL Editor → New query**.
5. Open `supabase/migrations/0001_init.sql` in this folder. Copy the entire contents, paste into the SQL editor, click **Run**. You should see "Success. No rows returned."
6. *(Optional — seed sample meds matching your sheet)* Repeat step 5 with `supabase/seed.sql`.
7. In the left sidebar: **Project Settings → API**. Copy these three values into a text editor for the next part:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`)
   - **anon public** key (long string)
   - **service_role** key (long string — keep this one secret, do not paste anywhere public)

### Promote yourself to doctor

Magic-link sign-up creates everyone as a **servant** by default. To promote yourself:

1. After your first sign-in (see Part 3), go to Supabase → **Table Editor → profiles**.
2. Find your row, change `role` from `servant` to `doctor`, click **Save**.
3. Refresh the app — you'll see the **Manage list** button.

You'll do the same for any other doctor on the team.

---

## Part 2 — Deploy to Vercel

You don't need to install Node.js locally for this — Vercel builds in the cloud.

### Option A — easiest (via GitHub)

1. Create a free GitHub account if you don't have one: <https://github.com/signup>.
2. Create a new repo called `guru-seva-meds`. Make it **private**.
3. Upload this folder to it (the green **Add file → Upload files** button on the GitHub repo page works — drag the entire `guru-seva-meds` folder in).
4. Go to <https://vercel.com> → sign in with GitHub.
5. **Add New → Project → Import** your `guru-seva-meds` repo.
6. Before deploying, expand **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 7 of Part 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `NEXT_PUBLIC_APP_URL` | leave blank for now; we'll set this after the first deploy |
   | `NEXT_PUBLIC_DEFAULT_TIMEZONE` | `America/Chicago` — *fallback only*. The live timezone is in the database and is changed by doctors at **Manage → Settings**. This env var only matters before the first time a doctor saves a timezone. |
   | `APP_GATE_PASSWORD` | `NitaiKripa` — the shared gate password. Tell every team member. Change anytime by updating this var and redeploying. |

7. Click **Deploy**. ~2 minutes later you get a live URL like `guru-seva-meds.vercel.app`.
8. Go back to Vercel → **Settings → Environment Variables** and set `NEXT_PUBLIC_APP_URL` to that URL (e.g. `https://guru-seva-meds.vercel.app`). Redeploy (Vercel → **Deployments → ⋯ → Redeploy**).

### Tell Supabase about your URL

1. Supabase → **Authentication → URL Configuration**.
2. Set **Site URL** to your Vercel URL.
3. Under **Redirect URLs**, add: `https://guru-seva-meds.vercel.app/auth/callback` (plus a localhost entry if you ever run dev: `http://localhost:3000/auth/callback`).
4. Save.

### Optional — custom domain

Open Vercel → your project → **Settings → Domains → Add**. Type the domain (e.g. `meds.kneetie.com`), follow the DNS instructions. Vercel will give you a CNAME — point it from whichever registrar holds the domain. Same pattern as kneetie.mobi. After the domain is live, update `NEXT_PUBLIC_APP_URL` and the Supabase **Site URL** + **Redirect URLs** to the new domain.

---

## Part 3 — First sign-in + import the medication list

1. Open `https://guru-seva-meds.vercel.app` on your phone or laptop.
2. **Gate prompt:** type the shared password `NitaiKripa` → Continue. (Stored as an httpOnly cookie for 30 days on this device, so the team doesn't re-enter it daily.)
3. Enter your email → tap **Send sign-in link**.
4. Open the email, tap the link. You're in.
5. The first time, you'll be asked your name — type something like *Bhakta Rama* or *Dr. Baluja* and tap Continue.
6. Promote yourself to doctor (see "Promote yourself to doctor" in Part 1).
7. Refresh, click **Manage list → Import from Google Sheet**. The current sheet URL is pre-filled (`docs.google.com/spreadsheets/d/1dN21JTSAi7DVpeWoZ7UvQK41dHft0_g_4gAygdBXtdk`). Make sure it's set to **Anyone with the link can view** in Google Sheets share settings.
8. Tap **Preview from Google Sheet**.
9. Every row is shown with the parsed dosage, frequency, and times. Any row where frequency doesn't match the count of times is flagged with a red ✗ and *won't* be imported. Edit the source sheet, repeat preview.
10. Tap **Save N medications**. Done — the dashboard now shows every dose for the day.

### Inviting servants

Share the URL **and** the shared password (`NitaiKripa`). Each servant types the gate password once on their device, then signs in with their own email (magic link). They'll appear in Supabase → **Authentication → Users**. They default to `role = servant` (no promotion needed).

### Changing or rotating the shared password

If the password is ever leaked or you want to rotate it:

1. Vercel → your project → **Settings → Environment Variables**.
2. Edit `APP_GATE_PASSWORD`, set the new value.
3. **Redeploy** (Vercel → **Deployments → ⋯ → Redeploy**).
4. Tell the team the new password. Everyone's 30-day cookie still works against the OLD hash and will be invalidated automatically — they'll be prompted to re-enter at the gate. (Magic-link sessions are unaffected — they stay signed in.)

---

## Local development (optional)

If you want to run it on your laptop too:

1. Install Node.js 20+ from <https://nodejs.org/en/download> (use the official installer, not Homebrew).
2. In Terminal, `cd` into this folder and run `npm install`.
3. Copy `.env.local.example` → `.env.local`, fill in your Supabase keys.
4. `npm run dev` → open <http://localhost:3000>.

---

## File map

```
app/
  layout.tsx               root layout + global styles
  page.tsx                 redirects to /dashboard
  globals.css              Tailwind base
  enter/                   shared gate password (in front of per-user login)
    page.tsx
    actions.ts
  login/                   magic-link form
    page.tsx
    actions.ts
  auth/
    callback/route.ts      exchanges OAuth code for session
    sign-out/route.ts      sign-out endpoint
  dashboard/
    page.tsx               server fetch (meds, doses-today, dialysis state)
    dashboard-client.tsx   real-time UI + overdue banner + Mark as Given
    name-prompt.tsx        first-run "what's your name?"
    dialysis-toggle.tsx    "Today is a dialysis day" switch
    mark-given-button.tsx  per-row button + geolocation capture
    actions.ts             markGiven / undoGiven / setDialysisDay / saveOwnName
  manage/
    page.tsx               doctor-only list of medications
    medication-form.tsx    add/edit form (frequency vs. times validated)
    new/page.tsx           create
    [id]/page.tsx          edit
    row-actions.tsx
    actions.ts
    import/
      page.tsx             paste sheet URL OR upload CSV
      import-client.tsx    preview + commit
      actions.ts           fetch + parse + frequency-vs-times validation
components/ui/             Button, Card, Input, Label, Badge, Switch, Textarea
lib/
  supabase/{client,server,middleware}.ts
  gate.ts                  shared-password hashing + cookie helpers
  time.ts                  buildDoseSlots + overdue logic + IST helpers
  types.ts
  utils.ts
middleware.ts              auth gate + session refresh
supabase/
  migrations/0001_init.sql   schema + RLS + triggers + realtime publication
  seed.sql                   sample data (Modafinil omitted per Dr. Baluja)
```

---

## Phase II — future notes (do not build yet)

- **Dose history view** per medication (last 7/30 days). Data is already captured in `administrations`.
- **Push notifications** when something goes overdue. The dashboard already has the data; add a Supabase Edge Function + the Web Push API on top.
- **Multi-patient** support. Add a `patient_id` column to medications/administrations; everything else generalises.
- **PRN / as-needed meds**. Today's design assumes scheduled doses. Add a `dose_kind` column with `'scheduled' | 'prn'` to support both.
- **Offline-first Mark as Given.** Queue inserts in IndexedDB while offline, replay on reconnect.
- **In-app role management.** For now, promotion happens in Supabase Studio — simple and pragmatic.

## Patient-safety rules baked into Phase I (do not remove)

1. **Frequency is enforced.** Database CHECK constraint + server-action validation + import validation. A med with frequency = 2 and only 1 scheduled time cannot exist.
2. **No grace window.** A dose flips red the instant the scheduled time passes.
3. **Overdue is unmissable.** A pinned red banner counts overdue doses and scrolls to them on tap; rows auto-sort overdue → upcoming → given.

Driven by a real nebulization mishap. Any change that softens these is a regression — call it out and ask before merging.
