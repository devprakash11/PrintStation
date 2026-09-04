# PrintStation Backend

Production-oriented REST API for PrintStation using Node.js, Express, PostgreSQL and Supabase Storage.

## Stack
- Node.js + Express 5
- PostgreSQL (Supabase recommended)
- JWT access tokens
- bcrypt password hashing
- Supabase Storage for uploaded documents and QR assets
- Helmet, CORS, rate limiting, Zod validation

## Structure
```text
backend/
├── .env.example
├── package.json
├── README.md
├── sql/
│   └── schema.sql
└── src/
    ├── app.js
    ├── server.js
    ├── config/env.js
    ├── db/pool.js
    ├── middleware/auth.js
    ├── middleware/errorHandler.js
    ├── middleware/validate.js
    ├── routes/auth.routes.js
    ├── routes/users.routes.js
    ├── routes/printers.routes.js
    ├── routes/qr.routes.js
    ├── routes/printJobs.routes.js
    ├── routes/reports.routes.js
    ├── routes/settings.routes.js
    ├── routes/uploads.routes.js
    └── services/storage.js
```

## Setup
1. Create a Supabase project and run `sql/schema.sql` in SQL Editor.
2. Create a private Storage bucket named `print-files`.
3. Copy `.env.example` to `.env` and fill the values.
4. From `backend/`, run `npm install` then `npm run dev`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `JWT_SECRET` in the frontend. The backend uses the service role only for trusted server-side Storage operations.

## Main endpoints
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET/POST/PATCH/DELETE /api/v1/users`
- `GET/POST/PATCH/DELETE /api/v1/printers`
- `GET/POST/DELETE /api/v1/qr-codes`
- `GET/POST/PATCH /api/v1/print-jobs`
- `GET /api/v1/reports/overview`
- `GET/PATCH /api/v1/settings`
- `POST /api/v1/uploads`
- `GET /api/v1/health`

All admin resources except authentication and health require `Authorization: Bearer <token>`.
