# 20-Point Inspection — Standalone Form

A mobile-friendly fillable version of the "Base [2026] 20-Point Inspection"
checklist, for field technicians to fill out on a phone/tablet on site.
The top "Site Information" section captures the site name, service site
address, and contact info (email + phone) for the client/site contact, the
Prospect Solar Service PM, and the Prospect Solar Tech Onsite — all
optional except site name. Below that, each of the 20 checklist items gets
a Pass / Flag / N-A status, an optional note, and an optional photo
(compressed in the browser before it's saved).

- `/` — the inspection form (requires technician login)
- `/log` — a shared log of every submission (expandable rows, photos inline)
- `/admin` — add/deactivate technicians and reset passwords (requires the admin password)
- `/api/inspections` — GET (list) / POST (create), backed by Postgres

## Technician login

Field technicians sign in at `/login` with a username and password; the
submitted inspection is stamped with whoever is logged in, so the
"Technician" field is no longer free text. There's no self-signup — an
admin creates each technician's account from `/admin`.

Auth is intentionally dependency-free: passwords are hashed with Node's
built-in `scrypt` (see `lib/auth.js`), and sessions are signed cookies
(HMAC-SHA256) rather than a database-backed session store. Deactivating a
technician from `/admin` takes effect immediately — every request re-checks
`active` in the database — not just on their next login.

## Deploying to Vercel

1. **Push this code to GitHub.** From this folder:

   ```
   git init
   git add .
   git commit -m "Initial commit: 20-point inspection form"
   ```

   Create a new **empty** repo on GitHub (no README/gitignore — this folder
   already has one), then:

   ```
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```

   (If you use the GitHub CLI instead: `gh repo create <repo-name> --private --source=. --remote=origin --push`.)

2. **Import into Vercel.** Go to vercel.com/new, select the repo. It's a
   standard Next.js 14 app — Vercel auto-detects the build settings, so just
   click Deploy.

3. **Add Postgres.** In the project's **Storage** tab, click **Create
   Database** → Postgres. Connecting it to the project sets the env vars the
   app reads automatically (`POSTGRES_URL`, or whichever of `DATABASE_URL` /
   `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` Vercel provides — see
   `lib/db.js`). All tables are created automatically on first use, so
   there's no migration step.

4. **Add two more env vars** (Settings → Environment Variables):

   - `SESSION_SECRET` — a random secret used to sign login sessions. Generate
     one with `openssl rand -hex 32` (or any long random string) and paste it
     in. Anyone with this value could forge a login, so don't reuse it or
     commit it to the repo.
   - `ADMIN_PASSWORD` — the password you'll use to sign in at `/admin` to
     manage technician accounts. Pick something only you know.

5. **Redeploy** so the new env vars take effect (Deployments tab → ⋯ →
   Redeploy).

6. **Create your first technician.** Go to `https://<your-app>.vercel.app/admin`,
   sign in with `ADMIN_PASSWORD`, and add a technician (name, username,
   initial password). Give those credentials to the technician — they sign
   in at `/login`.

Your form will be live at the `*.vercel.app` URL Vercel gives you.

## Local development

```
npm install
vercel env pull .env.local   # once the project is deployed and has Postgres attached
npm run dev
```

Or point `.env.local` at any Postgres instance yourself, and set the two
auth env vars too:

```
POSTGRES_URL=postgres://user:password@host:5432/dbname
SESSION_SECRET=some-long-random-string
ADMIN_PASSWORD=whatever-you-want-for-local-testing
```

## Item list

Reconstructed from the source PDF (see the project notes for the
extraction ambiguity around item 12 and a few reassigned rows):

1–6. **Inverter Maintenance** — Electrical Conditions, Cabinet Enclosure(s),
Fuses, Fault Codes, Intake Air Duct(s)/Fan Operation, Monitoring Equipment

7–10. **Module Maintenance** — Micro-Fractures, Electrical Connections,
String Wiring, Soiling/Build-Up

11–12. **Racking/Structural Integrity** — PV Racking Structure, Inverter &
Electrical BOS Mount(s)

13–14. **Conduit: Runs, Bodies & Fittings** — Connections & Corrosion,
Conduit/Conductor Wear (notify)

15–20. **PV System General** — Building Envelope, Component Enclosures
(notify), Shade Obstructions, Monitoring Access, Balance of System,
Pest/Critter Intrusion

Worth a quick check against the original paper form before this becomes the
source of truth.

## Possible follow-ups

- Wire submissions into Salesforce (e.g. auto-create/update a Case per
  inspection).
- Add "forgot password" self-service for technicians (currently an admin
  has to reset it from `/admin`).
- Add a second admin account / admin roles if more than one person needs
  `/admin` access — right now it's a single shared `ADMIN_PASSWORD`.
