# KUBIK Portal demo deployment

The standalone demo uses one Vercel project and one Neon PostgreSQL project.

## Neon

1. Create a PostgreSQL project.
2. Open the Neon SQL editor and run `database/database.sql`.
3. Copy the pooled connection string for `DATABASE_URL`.

## Vercel

Import the repository with its root directory unchanged. `vercel.json` installs
the backend and frontend from their individual lockfiles, builds the Vite app
and exposes Express under `/api`.

Configure these environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://YOUR_PROJECT.vercel.app
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DATABASE_POOL_MAX=5
SESSION_SECRET=replace-with-at-least-32-random-characters
```

Use the Neon pooled URL for serverless connection reuse. The pool is bounded to
five connections per warm Vercel function instance.

Email and OTP variables are intentionally documented in their own later
feature commits.
