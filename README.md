# PrintStation

PrintStation is a full-stack printer management and wireless print workflow application.

## Project Structure

```text
PrintStation/
├── frontend/
├── backend/
└── package.json
```

The repository is an npm workspace monorepo. The root `package.json` manages both `frontend` and `backend` workspaces.

## Local Development

### 1. Open the repository root

The repository must be located at a path such as:

```text
D:\PrintStation\PrintStation
```

The root folder contains `package.json`.

Do **not** run the root npm commands from:

```text
D:\PrintStation
```

unless that folder itself contains the cloned repository.

### 2. Install dependencies

From the repository root:

```cmd
cd /d D:\PrintStation\PrintStation
npm install
```

The frontend already declares `react-router-dom` as a dependency.

### 3. Start the frontend

```cmd
npm run dev:frontend
```

Or directly:

```cmd
cd frontend
npm run dev
```

### 4. Start the backend

In another terminal:

```cmd
cd /d D:\PrintStation\PrintStation
npm run dev:backend
```

### 5. Build the application

From the repository root:

```cmd
npm run build
```

## Common npm ENOENT Error

If npm reports:

```text
ENOENT: no such file or directory, open 'D:\PrintStation\package.json'
```

npm is being run from the wrong directory. Change into the actual repository root first:

```cmd
cd /d D:\PrintStation\PrintStation
```

Then verify the file exists:

```cmd
dir package.json
```

After that run:

```cmd
npm install
```

If you only want to install frontend dependencies:

```cmd
cd frontend
npm install
```

## React Router

`frontend/package.json` includes:

```json
"react-router-dom": "latest"
```

Therefore, after a clean installation, `BrowserRouter` can be imported from `react-router-dom`.

## Environment Variables

Keep local secrets in `.env` files and never commit service-role keys or database credentials. Commit only safe `.env.example` files.
