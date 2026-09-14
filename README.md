# PrintStation

PrintStation is a full-stack printer management and wireless print workflow application.

## Project Structure

```text
PrintStation/
├── frontend/
├── backend/
└── package.json
```

The repository is an npm workspace monorepo. The root `package.json` manages both workspaces.

## Local Development

### 1. Open the repository root

Use the actual repository directory, for example:

```cmd
cd /d D:\PrintStation\printstation
```

Verify the root package exists:

```cmd
dir package.json
```

### 2. Install dependencies

From the repository root:

```cmd
npm install
```

### 3. Configure the backend

Create `backend/.env` from `backend/.env.example`.

Required values:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
AGENT_SECRET_PEPPER=your_long_random_secret
QR_BASE_URL=http://localhost:5173/print
MAX_FILE_SIZE_MB=20
```

Never commit `backend/.env` or database credentials.

### 4. Apply the database schema

Run the SQL in:

```text
backend/sql/schema.sql
```

against the PostgreSQL database configured in `DATABASE_URL`.

### 5. Create or reset the admin account

From the repository root:

```cmd
npm run seed:admin
```

Or, if you are already inside `frontend`:

```cmd
npm run seed:admin
```

The frontend now forwards this command to the backend workspace.

Set the credentials in `backend/.env` before running it:

```env
ADMIN_EMAIL=admin@printstation.com
ADMIN_PASSWORD=replace-with-your-admin-password
```

### 6. Start the backend

From the repository root:

```cmd
npm run dev:backend
```

The local API runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/v1/health
```

The health endpoint also verifies database connectivity.

### 7. Start the frontend

In another terminal:

```cmd
npm run dev:frontend
```

Or from `frontend`:

```cmd
npm run dev
```

The Vite development proxy forwards `/api` requests to `http://localhost:5000`.

### 8. Start the backend while inside frontend

If your current terminal is:

```text
D:\PrintStation\printstation\frontend
```

you can run:

```cmd
npm run backend
```

This starts the backend from the frontend workspace for convenience.

## Local API Configuration

`frontend/src/services/api.js` uses:

```text
VITE_API_BASE_URL || /api/v1
```

For local development, leave `VITE_API_BASE_URL` empty so Vite proxies `/api` to the local backend.

For a deployed frontend, set `VITE_API_BASE_URL` to the deployed API base, for example:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api/v1
```

Do not put JWT secrets, database credentials, agent secrets, or service-role keys in frontend environment variables.

## Authentication

The admin login endpoint is:

```text
POST /api/v1/auth/login
```

The frontend uses the returned JWT for protected admin requests and calls:

```text
GET /api/v1/auth/me
```

A failed login should normally return `401`. A `502` during local development indicates that the browser/Vite proxy cannot get a valid response from the local backend, so check that the backend is running on port `5000` first.

## Build

From the repository root:

```cmd
npm run build
```

Frontend only:

```cmd
npm run build:frontend
```

Backend only:

```cmd
npm run build:backend
```

## Architecture

```text
Customer Phone
      |
      v
PrintStation Frontend
      |
      v
PrintStation Backend / API
      |
      +---- PostgreSQL
      |
      +---- Print Queue
      |
      +---- WebSocket / Agent API
      |
      v
PrintStation Agent
      |
      v
Host OS Print Subsystem / Installed Driver
      |
      v
Physical Printer
```

The backend is designed as a long-running Node.js service because the Agent communication layer uses WebSockets. Deploy the backend on a persistent Node.js host such as Render or Railway rather than relying on a serverless runtime for the Agent connection.

## Security

- Keep `.env` files out of Git.
- Keep database credentials server-side.
- Keep `JWT_SECRET` and `AGENT_SECRET_PEPPER` server-side.
- Do not use `VITE_` variables for secrets.
- Use HTTPS/WSS in production.
- Use a strong unique admin password.

## Troubleshooting 502 During Local Login

If the browser shows:

```text
/api/v1/auth/login 502 Bad Gateway
```

run the following from the repository root:

```cmd
npm run dev:backend
```

Then open:

```text
http://localhost:5000/api/v1/health
```

If the health endpoint fails, fix the backend or database connection first.

If the health endpoint works, restart the frontend:

```cmd
npm run dev:frontend
```

Then retry login. The Vite proxy in `frontend/vite.config.js` targets `http://localhost:5000`.
