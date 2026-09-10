# 20-Point Inspection — Standalone Form

A mobile-friendly fillable version of the "Base [2026] 20-Point Inspection"
checklist, for field technicians to fill out on a phone/tablet on site.
Each of the 20 checklist items gets a Pass / Flag / N-A status, an optional
note, and an optional photo (compressed in the browser before it's saved).

- `/` — the inspection form
- `/log` — a shared log of every submission (expandable rows, photos inline)
- `/api/inspections` — GET (list) / POST (create), backed by Postgres

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
   `lib/db.js`). The `inspections` table is created automatically on the
   first API call, so there's no migration step.

4. **Redeploy** if you added the database after the first deploy, so the new
   env vars take effect (Deployments tab → ⋯ → Redeploy).

Your form will be live at the `*.vercel.app` URL Vercel gives you.

## Local development

```
npm install
vercel env pull .env.local   # once the project is deployed and has Postgres attached
npm run dev
```

Or point `.env.local` at any Postgres instance yourself:

```
POSTGRES_URL=postgres://user:password@host:5432/dbname
```

## No authentication is built in

Anyone with the URL can submit or view entries. If that's a problem, two
options:

- **Vercel Deployment Protection** (Settings → Deployment Protection) —
  built in, but requires a paid plan.
- **Shared-PIN gate** — free, but needs a small code change: check a PIN
  (stored as an env var) against a cookie or query param before rendering
  the form/log, e.g. in `middleware.js`. Ask if you'd like this added.

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
- Add a shared-PIN gate or real auth if open access becomes a concern.
- Add technician name auto-fill once there's a login/identity layer.
