# PrintStation Backend

Production-oriented REST API for PrintStation using Node.js, Express, PostgreSQL and Supabase Storage.

## Stack

- Node.js + Express 5
- PostgreSQL (Supabase recommended)
- JWT access tokens
- bcrypt password hashing
- Supabase Storage for private uploaded documents
- Helmet, CORS, rate limiting, Zod validation

## Architecture

```text
backend/
├── api/
│   └── index.js                 # Vercel serverless entrypoint
├── sql/
│   ├── schema.sql               # Base database schema
│   └── 002_hardening.sql        # Indexes, triggers and defaults
├── src/
│   ├── app.js                   # Express application
│   ├── server.js                # Local HTTP entrypoint
│   ├── config/
│   │   └── env.js               # Environment configuration
│   ├── db/
│   │   └── pool.js              # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication / RBAC
│   │   ├── errorHandler.js      # Central API error handling
│   │   └── validate.js          # Zod request validation helper
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── printers.routes.js
│   │   ├── qr.routes.js
│   │   ├── printJobs.routes.js
│   │   ├── reports.routes.js
│   │   ├── settings.routes.js
│   │   └── uploads.routes.js
│   └── services/
│       └── storage.js            # Supabase Storage abstraction
├── .env.example
├── package.json
└── vercel.json
```

## Local setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `sql/schema.sql` once.
3. For an existing database, run `sql/002_hardening.sql` after the base schema.
4. Create a **private** Storage bucket named `print-files`.
5. Copy `.env.example` to `.env` and fill in the server credentials.
6. From `backend/`, run `npm install` and then `npm run dev`.
7. From `frontend/`, keep `VITE_API_BASE_URL` empty for local development so Vite proxies `/api` to `http://localhost:5000`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `JWT_SECRET` to the browser. The service-role key is server-only and is used for trusted Storage operations.

## Environment variables

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1d
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
SUPABASE_STORAGE_BUCKET=print-files
MAX_FILE_SIZE_MB=20
```

## API surface

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/v1/health` |
| Authentication | `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` |
| Users | `GET/POST/PATCH/DELETE /api/v1/users` |
| Printers | `GET/POST/PATCH/DELETE /api/v1/printers` |
| QR codes | `GET/POST/DELETE /api/v1/qr-codes`, `GET /api/v1/qr-codes/public/:token` |
| Print jobs | `GET/POST /api/v1/print-jobs`, `PATCH /api/v1/print-jobs/:id/status` |
| Reports | `GET /api/v1/reports/overview` |
| Settings | `GET /api/v1/settings`, `PATCH /api/v1/settings/:key` |
| Uploads | `POST /api/v1/uploads` |

All protected resources require `Authorization: Bearer <token>` and enforce role-based access where appropriate.

## Security rules

- Passwords are stored as bcrypt hashes, never plaintext.
- JWTs contain only the user ID, email and role.
- Database access stays on the backend.
- Supabase Storage remains private; uploaded files are returned through short-lived signed URLs.
- Uploads are limited to PDF, JPG and PNG and capped by `MAX_FILE_SIZE_MB`.
- Authentication endpoints are rate-limited.
- PostgreSQL Row Level Security is enabled on application tables.

## Vercel deployment

1. Import `PrintStation` into Vercel.
2. Set the backend root directory to `backend`.
3. Add the production environment variables listed above.
4. Set `CLIENT_ORIGIN` to the deployed frontend origin(s).
5. Deploy. The Vercel entrypoint is `api/index.js`.

For the frontend deployment, set `VITE_API_BASE_URL` to the deployed backend API base, for example `https://<backend-domain>/api/v1`.
