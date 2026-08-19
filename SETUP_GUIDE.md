# KUBIK Portal local setup

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 16+ or a free Neon project

## Database

Create a PostgreSQL database and apply the idempotent schema:

```bash
psql "$DATABASE_URL" -f database/database.sql
```

The schema creates the portal tables, PostgreSQL-backed HTTP sessions and the
deterministic demo fixtures. It can be applied more than once without replacing
existing records.

## Environment

Copy `backend/.env.example` to `backend/.env` and provide:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DATABASE_POOL_MAX=5
SESSION_SECRET=replace-with-at-least-32-random-characters
OTP_HASH_SECRET=replace-with-an-independent-32-character-secret
OTP_TTL_MINUTES=10
OTP_RESEND_SECONDS=60
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=replace-with-brevo-smtp-login
SMTP_PASS=replace-with-brevo-smtp-key
SMTP_FROM_EMAIL=replace-with-a-verified-sender@example.com
SMTP_FROM_NAME=KUBIK Portal Demo
```

## Install and run

```bash
npm run install:all
npm run dev:api
```

In a second terminal:

```bash
npm run dev:web
```

The Vite development server proxies `/api` requests to the Express API on port
5000. Production uses the same origin through the Vercel rewrite.
