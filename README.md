# BrandPulse AI — Setup Guide

## Project Structure
```
brandpulse/
├── backend/          ← Node.js + Express API
│   ├── config/
│   │   └── database.js      (PostgreSQL connection + schema)
│   ├── middleware/
│   │   └── auth.js           (JWT middleware)
│   ├── routes/
│   │   └── auth.js           (signup, login, forgot/reset password)
│   ├── server.js             (main entry point)
│   └── .env.example          (copy to .env and fill in values)
│
└── frontend/         ← React app
    └── src/
        ├── context/
        │   └── AuthContext.js (global auth state)
        ├── pages/
        │   ├── Login.jsx
        │   ├── SignUp.jsx
        │   ├── PasswordReset.jsx
        │   └── Dashboard.jsx
        ├── components/
        │   └── ProtectedRoute.jsx
        ├── styles/
        │   └── global.css
        └── App.js
```

---

## Step 1 — Install PostgreSQL

### Mac
```bash
brew install postgresql
brew services start postgresql
```

### Windows
Download from https://www.postgresql.org/download/windows/

### Linux (Ubuntu)
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## Step 2 — Create the database

```bash
psql -U postgres
CREATE DATABASE brandpulse;
\q
```

---

## Step 3 — Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
- `DB_PASSWORD` — your PostgreSQL password
- `JWT_SECRET` — any long random string (e.g. run `openssl rand -hex 32`)
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- Email settings (optional for now, only needed for password reset)

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL
✅ Database tables ready
🚀 BrandPulse AI Server running on http://localhost:5000
```

---

## Step 4 — Frontend setup

```bash
cd frontend
npm install
npm start
```

Opens at http://localhost:3000

---

## Step 5 — Test the auth flow

1. Visit http://localhost:3000 → redirected to /login
2. Click "Sign up free" → fill form → submit
3. Gets redirected to /dashboard
4. Refresh page → stays logged in (JWT in localStorage)
5. Click logout → redirected back to /login
6. Test /forgot-password flow

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Create account |
| POST | /api/auth/login | No | Log in |
| GET | /api/auth/me | Yes | Get current user |
| PUT | /api/auth/profile | Yes | Update profile |
| POST | /api/auth/forgot-password | No | Send reset email |
| POST | /api/auth/reset-password | No | Reset with token |
| GET | /api/health | No | Health check |

---

## Deployment (later)

- **Frontend** → Vercel (`vercel deploy` in /frontend)
- **Backend** → Railway or Render (connect GitHub repo)
- **Database** → Supabase or Railway PostgreSQL (free tier)

---

## Next steps after auth

1. Template Library (Phase 2)
2. Design Editor with Fabric.js (Phase 3)
3. Multi-platform publishing (Phase 4)
4. Analytics dashboard (Phase 5)
5. Claude AI recommendations (Phase 6)
