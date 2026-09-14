# PrintStation Agent

The PrintStation Agent is the Windows bridge between the PrintStation backend and printers installed on a shop/workstation computer.

## What it does

- Connects to the backend through WebSocket.
- Authenticates using a paired Agent ID and secret.
- Discovers Windows printers through `Get-Printer`.
- Reports printer status and basic driver/port capabilities.
- Receives print-job status commands.
- Prints a local file through the Windows `PrintTo` shell verb.
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

## Current print execution boundary

The Agent can execute a print job when the job contains a **local `file_path`**. The current backend queue sends `storage_path` because permanent object storage and Agent-authenticated file download are still being integrated. Therefore, remote customer files are **not yet production-printable end-to-end**.

The next backend integration must provide a secure, short-lived download mechanism from object storage to the Agent, after which `handlePrintJob()` can download the file into `data/jobs/` and pass that local path to the Windows print subsystem.

## Security

Never commit `.env`. Never put the Agent secret in frontend code. Use `wss://` and HTTPS when the backend is deployed.
