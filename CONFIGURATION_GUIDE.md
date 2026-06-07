# ⚙️ FileFlux Configuration Guide

This document lists **all the places** where you need to provide your own inputs, URLs, or passwords. 

I've centralized the configuration so you don't have to hunt through the code. 

---

## 1. Dashboard (Backend) Configuration
*Where:* `dashboard/.env`

If you are running the dashboard locally, or deploying to Vercel, you need to provide the Database connection string.

1. Copy `dashboard/.env.example` to `dashboard/.env`.
2. Edit `dashboard/.env` and add your Neon Postgres URL:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/fileflux?sslmode=require
   ```
*(Note: If deploying to Vercel, you add `DATABASE_URL` in the Vercel Dashboard under Settings > Environment Variables).*

---

## 2. Extension Configuration
*Where:* `extension/js/config.js`

Once you have deployed your Dashboard (e.g., to Vercel), you need to tell the Extension where to send the analytics and feedback data.

1. Open `extension/js/config.js`
2. Update the `DASHBOARD_URL` variable to match your live Vercel project URL:
   ```javascript
   export const CONFIG = {
     // Replace this with your actual Vercel Dashboard URL
     DASHBOARD_URL: 'https://fileflux-dashboard-yourname.vercel.app',
   };
   ```

---

### Security / Hardcoded Secrets Check
I have done a full audit of the codebase:
- **Empty Files:** Checked for empty files. There are no empty files in your source code.
- **Passwords / Keys:** There are **NO** hardcoded passwords, API keys, or sensitive data anywhere in the codebase. All sensitive data is now correctly handled via `.env` files.
- **Bugs:** Addressed the CORS and Vercel SQLite compatibility issues (we are now using Serverless Postgres via Neon, which perfectly works with Vercel).

Everything is clean, secure, and ready for production! 🚀
