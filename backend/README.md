# PrintStation Backend v2

Clean Node.js/Express backend for the PrintStation web app and local PrintStation Agent.

## Architecture

Customer/Admin browser -> REST API -> PostgreSQL -> queued print job -> WebSocket -> PrintStation Agent -> OS printer subsystem -> physical printer.

The backend does not try to control USB/Wi-Fi printers directly. The Agent runs on the computer where the printer is installed and uses the operating system's printer drivers.

## Stack

- Node.js + Express
- PostgreSQL
- JWT admin/staff/operator authentication
- WebSocket (`ws`) for Agent communication
- Multer for upload intake
- Zod for request validation

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `JWT_SECRET`, `AGENT_SECRET_PEPPER`, and `CLIENT_ORIGIN`.
3. Run `backend/sql/schema.sql` in the PostgreSQL/Supabase SQL editor.
4. From the repository root run `npm install`.
5. Start the API with `npm run dev:backend`.
6. Create an admin with `ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='a-strong-password' npm run seed:admin`.

## Core endpoints

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/agents/pairing-codes` admin
- `POST /api/v1/agents/pair` Agent
- `GET /api/v1/agents` admin
- `GET /api/v1/printers` admin/staff/operator
- `POST /api/v1/printers` admin/staff/operator
- `GET /api/v1/qr-codes` admin/staff/operator
- `POST /api/v1/qr-codes` admin/staff/operator
- `GET /api/v1/qr-codes/public/:token` customer
- `POST /api/v1/print-jobs/public` customer
- `GET /api/v1/print-jobs` admin/staff/operator
- `PATCH /api/v1/print-jobs/:id/cancel` admin/staff/operator
- `GET /api/v1/reports/summary` admin/staff/operator
- `POST /api/v1/uploads` customer
- `GET /api/v1/health`

## Agent WebSocket

Connect to `/ws/agent` and authenticate with:

```json
{"type":"authenticate","agentId":"AGENT_ID","secret":"AGENT_SECRET"}
```

The Agent then sends heartbeats, printer discovery/status messages, and job status updates. The backend sends queued jobs for printers assigned to that Agent.

## Important deployment note

This backend uses a persistent WebSocket connection, so deploy it to a long-running Node service such as Railway or Render. Do not deploy the WebSocket server as a Vercel serverless function.
