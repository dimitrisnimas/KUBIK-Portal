# KUBIK Portal demo deployment

The standalone demo uses one Vercel project and one Neon PostgreSQL project.

## Neon

1. Create a PostgreSQL project.
2. Open the Neon SQL editor and run `database/database.sql`.
3. Copy the pooled connection string for `DATABASE_URL`.

## Vercel

Import the repository with its root directory unchanged and select **Services**
as the project framework. `vercel.json` builds `frontend/` as Vite and
`backend/` as Express, then routes `/api/*` to the backend service.

Configure these environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://YOUR_PROJECT.vercel.app
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DATABASE_POOL_MAX=5
SESSION_SECRET=replace-with-at-least-32-random-characters
OTP_HASH_SECRET=replace-with-a-different-32-character-secret
OTP_TTL_MINUTES=10
OTP_RESEND_SECONDS=60
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=YOUR_BREVO_SMTP_LOGIN
SMTP_PASS=YOUR_BREVO_SMTP_KEY
SMTP_FROM_EMAIL=YOUR_VERIFIED_SENDER
SMTP_FROM_NAME=KUBIK Portal Demo
```

Use the Neon pooled URL for serverless connection reuse. The pool is bounded to
five connections per warm Vercel function instance.

For a database created before passwordless authentication was added, run
`database/migrations/2026081901_passwordless_otp.up.sql` once in the Neon SQL
editor. The application never stores an OTP in plaintext.
