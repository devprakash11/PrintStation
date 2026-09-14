# PrintStation Agent

The PrintStation Agent is the Windows bridge between the PrintStation backend and printers installed on a shop/workstation computer.

## What it does

- Connects to the backend through WebSocket.
- Authenticates using a paired Agent ID and secret.
- Discovers Windows printers through `Get-Printer`.
- Reports printer status and basic driver/port capabilities.
- Receives queued print jobs.
- Authenticates back to the backend to download the job file.
- Stores the file temporarily on the workstation.
- Prints the file through the Windows `PrintTo` shell verb.
- Reports downloading, printing, completed, and failed states.
- Deletes the temporary local job file after processing.
- Reconnects automatically when the backend connection drops.

## Requirements

- Windows 10/11
- Node.js 18+
- The printer must be installed in Windows and visible in **Settings > Bluetooth & devices > Printers & scanners**.
- The backend must be running and reachable from this computer.

## Install

From the repository root:

```cmd
cd agent
npm install
```

Copy `.env.example` to `.env` and set:

```env
PRINTSTATION_API_URL=http://localhost:5000
PRINTSTATION_WS_URL=ws://localhost:5000/ws/agent
AGENT_ID=your-agent-id
AGENT_SECRET=your-agent-secret
AGENT_NAME=Shop Computer 01
```

The Agent ID and secret are returned once when an admin pairs the computer using a valid pairing code. Keep the secret private.

## Run

```cmd
npm start
```

For development:

```cmd
npm run dev
```

## Printer discovery

The Agent uses PowerShell's `Get-Printer` command. It reports the Windows printer name, driver, port, shared state, offline state, and a normalized PrintStation status.

## Print flow

```text
Backend queue
   -> WebSocket print_job
   -> Agent authenticates download request
   -> Backend verifies Agent owns the printer/job
   -> File downloaded to agent/data/jobs
   -> Windows PrintTo
   -> completed/failed status sent to backend
   -> temporary file removed
```

## Important production note

The current backend stores uploaded files on its local filesystem. This makes the complete flow functional for a backend that can persist its filesystem and is suitable for local testing. For a production deployment where the backend filesystem is ephemeral or horizontally scaled, replace the local upload store with private object storage such as Supabase Storage and keep the same authenticated Agent download contract.

## Security

Never commit `.env`. Never put the Agent secret in frontend code. The Agent file endpoint requires both the Agent ID and secret and verifies that the requested job belongs to a printer assigned to that Agent. Use `wss://` and HTTPS when the backend is deployed.
