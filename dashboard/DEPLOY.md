# FileFlux Dashboard — Vercel Deployment Guide

## Step 1 — Create a Neon Database (free)

1. Go to **[console.neon.tech](https://console.neon.tech)** and sign up (free)
2. Click **"New Project"** → name it `fileflux`
3. Once created, go to **Connection Details**
4. Copy the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2 — Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
# Install Vercel CLI (once)
npm install -g vercel

# Inside the dashboard/ folder:
cd /workspace/Extension/dashboard
vercel

# Follow the prompts:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N
#   Project name? → fileflux-dashboard
#   Directory? → ./ (current)
```

When asked to set environment variables, or after deployment:

```bash
vercel env add DATABASE_URL
# Paste your Neon connection string when prompted
```

Then redeploy to apply it:
```bash
vercel --prod
```

### Option B — Vercel Dashboard (no CLI)

1. Push the `dashboard/` folder to a GitHub repo
2. Go to **[vercel.com](https://vercel.com)** → **New Project** → Import your repo
3. Set **Root Directory** to `dashboard/` (if in a monorepo)
4. Under **Environment Variables**, add:
   - Key: `DATABASE_URL`
   - Value: your Neon connection string
5. Click **Deploy**

---

## Step 3 — Verify

Once deployed, visit:
```
https://your-project.vercel.app/api/health
```

You should see:
```json
{ "status": "ok", "db": "neon-postgres", "totalFeedback": 0, ... }
```

The schema (tables) are **auto-created** on the first request — no manual migration needed.

---

## Step 4 — Connect Extension to Live Dashboard

Update `background.js` in the extension:

```js
// Replace this:
const DASHBOARD_URL = 'https://fileflux-dashboard.vercel.app/api/feedback';

// With your actual Vercel URL:
const DASHBOARD_URL = 'https://YOUR-PROJECT.vercel.app/api/feedback';
```

---

## Local Development

```bash
cp .env.example .env
# Edit .env and paste your DATABASE_URL

npm install
npm start
# → http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/feedback` | Submit feedback from extension |
| `GET`  | `/api/feedback` | List feedback (`?type=bug&status=new`) |
| `GET`  | `/api/feedback/recent` | Last N items |
| `GET`  | `/api/feedback/export` | Download as CSV |
| `PATCH`| `/api/feedback/:id/status` | Update status |
| `DELETE`| `/api/feedback/:id` | Delete item |
| `POST` | `/api/analytics` | Receive usage events |
| `GET`  | `/api/stats` | Full dashboard stats |
| `GET`  | `/api/health` | Health check |
