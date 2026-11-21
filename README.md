# Cross-Platform Hardening

A web-based endpoint security monitoring platform with a React dashboard, Node.js/Express API, MongoDB persistence, a Python monitoring agent, and Gemini-powered AI security assessments.

> **Scope:** This repository is a monitoring and advisory prototype, not an automated hardening or intrusion-prevention system. AI recommendations are advisory; reported listening ports do not necessarily indicate external exposure.

## Features

- Register and list endpoint agents (Windows, Linux, and macOS identifiers).
- Collect firewall status, listening TCP ports, running service counts, and recent failed-login attempts using the Python agent.
- Upload and store periodic security reports in MongoDB.
- View dashboard, devices, security status, and alerts in the React application.
- Automatically refresh security status in the UI every 30 seconds.
- Generate a Gemini AI assessment of the latest security report, including a risk level, key findings, and recommendations.
- Save and view previous AI analyses.

## Technology stack

| Component | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Axios, React Markdown |
| Backend | Node.js, Express 5, Mongoose 9, CORS |
| Database | MongoDB |
| Monitoring agent | Python 3, `psutil`, `requests`, `python-dotenv` |
| AI | Google Gemini via `@google/genai` |

## Architecture

```text
Monitored computer (Python agent)
    | POST /api/agents/register
    | POST /api/security/status (periodically)
    v
Express API <----> MongoDB (agents, reports, alerts, AI analyses)
    ^
    | HTTP requests
React / Vite dashboard
    |
    | POST /api/ai/analyze/:agentId
    v
Express AI controller --> Gemini API --> stored text analysis
```

The Python agent runs on each monitored computer. The backend and MongoDB may run on the same machine or on another reachable host. The React frontend communicates with the backend; it does not communicate directly with the agent or Gemini.

## Prerequisites

- **Node.js and npm:** a modern Node.js version compatible with Vite 8 (Node.js **20.19+ or 22.12+**); Node.js 22 LTS is a convenient choice.
- **Python 3:** Python 3.10+ recommended; the project has been developed with Python 3.13.
- **MongoDB:** local MongoDB Community Server or a MongoDB Atlas connection string.
- **Gemini API key:** required only to generate AI security assessments. Obtain your own key from [Google AI Studio](https://aistudio.google.com/apikey).
- Network access to the backend from the agent and frontend; internet access for Gemini calls.

The Python agent uses operating-system-specific commands for some checks. Windows uses PowerShell and Windows Security event logs; Linux uses system utilities and `journalctl`. Some checks may require elevated permissions. macOS is accepted as an agent OS, but several security checks are not fully implemented there; see [Platform limitations](#platform-limitations).

## Project layout

```text
cross-platform-Hardening/
├── agent/
│   ├── agent.py                 # Main monitoring loop
│   ├── api_client.py            # Backend requests
│   ├── config.py                # Agent configuration
│   ├── security_checks.py       # OS-specific security checks
│   ├── system_info.py           # Device metadata
│   ├── requirements.txt
│   └── .env.example
├── backend/
│   ├── app/app.js               # Express app and route registration
│   ├── config/database.js       # MongoDB connection
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/aiService.js    # Gemini integration
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/components/          # AI analysis UI
│   ├── src/pages/               # Dashboard, Devices, Security, Alerts
│   ├── src/services/api.js      # Axios API client
│   ├── package.json
│   └── .env.example
└── README.md
```

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cross-platform-Hardening.git
cd cross-platform-Hardening
```

Replace `YOUR_USERNAME` with the actual repository owner, or download and extract the repository ZIP.

## 2. Configure MongoDB

Start a local MongoDB server, or create a MongoDB Atlas database and obtain its connection string. For a local installation, the backend example uses:

```text
mongodb://127.0.0.1:27017/cross_platform_hardening
```

MongoDB must be reachable when starting the backend. The application creates its collections as records are inserted.

## 3. Configure and start the backend

Open a terminal in the project root:

```bash
cd backend
npm ci
```

Copy the example configuration:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Edit `backend/.env`. Set `MONGODB_URI` to your MongoDB connection string and `GEMINI_API_KEY` to your own key if you want AI analysis. The other values can normally stay at their local-development defaults.

Start the backend:

```bash
npm run dev
```

Or use `npm start` without automatic restart.

Confirm the backend is responding at **http://localhost:5000/api/system/health**. Expected JSON includes `"success": true`.

## 4. Configure and start the frontend

Open a **second terminal** in the project root:

```bash
cd frontend
npm ci
```

Create `frontend/.env` from `frontend/.env.example` using the same copy command for your operating system. The default is:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local address shown by Vite, typically **http://localhost:5173**. You can now navigate to Dashboard, Devices, Security, and Alerts. The device list will initially be empty until an agent registers.

## 5. Configure and run the Python agent

Open a **third terminal** in the project root:

```bash
cd agent
python -m venv .venv
```

Activate the virtual environment:

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows Command Prompt**
```bat
.venv\Scripts\activate.bat
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Copy `agent/.env.example` to `agent/.env` and review:

```dotenv
API_BASE_URL=http://localhost:5000/api
AGENT_ID=AGENT-001
AGENT_VERSION=1.0.0
MONITORING_INTERVAL=30
```

Start the agent:

```bash
python agent.py
```

The agent registers (or looks up) its public ID, collects security data, sends a report, and repeats every `MONITORING_INTERVAL` seconds. Stop it with **Ctrl+C**.

**Multiple computers:** Install and run the Python agent on each monitored machine, assign a **different `AGENT_ID`** (e.g., `AGENT-002`), and set `API_BASE_URL` to the backend machine's reachable IP address or hostname, e.g. `http://192.168.1.20:5000/api`. `localhost` refers to the machine running the agent, not the backend machine. Ensure the backend is reachable and configure the frontend API URL similarly if viewing it from another computer. Only use a trusted network; the current API does not implement agent authentication or transport encryption.

## 6. Generate an AI security assessment

1. Ensure the backend, MongoDB, frontend, and at least one agent are running.
2. Wait for the agent to upload its first report.
3. Open **Security** in the frontend and select the device.
4. In **AI Security Intelligence**, select **Generate AI Analysis**.
5. Review the risk level, summary, findings, and recommendations.
6. Select **View Analysis History** to inspect saved assessments.

The backend submits the latest report to Gemini. The current implementation requests a **short plain-text response** with `Risk Level`, `Summary`, `Key Findings`, and `Recommendations`; it is not a JSON-schema response. Gemini output is saved in MongoDB as an AI analysis associated with the agent and report.

## Environment variables

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `PORT` | Express HTTP port (default `5000`) |
| `backend/.env` | `MONGODB_URI` | **Required** MongoDB connection string |
| `backend/.env` | `FRONTEND_URL` | Allowed browser origin for CORS |
| `backend/.env` | `GEMINI_API_KEY` | Required for AI analysis |
| `backend/.env` | `GEMINI_MODEL` | Gemini model ID; code defaults to `gemini-2.5-flash` |
| `frontend/.env` | `VITE_API_BASE_URL` | Full backend API URL ending in `/api` |
| `agent/.env` | `API_BASE_URL` | Full backend API URL ending in `/api` |
| `agent/.env` | `AGENT_ID` | Unique public identifier per monitored endpoint |
| `agent/.env` | `AGENT_VERSION` | Agent version string |
| `agent/.env` | `MONITORING_INTERVAL` | Monitoring interval in seconds, minimum `5` |

Do **not** commit actual `.env` files, MongoDB credentials, or Gemini API keys. The repository `.gitignore` excludes `.env` files and allows `.env.example` files.

## API reference

All routes are relative to `http://localhost:5000` by default.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/system/health` | Backend health check |
| POST | `/api/agents/register` | Register an agent |
| GET | `/api/agents` | List registered agents |
| GET | `/api/agents/:agentId` | Find agent by **public** ID such as `AGENT-001` |
| POST | `/api/security/status` | Submit a security report |
| GET | `/api/security/status/:agentId` | Latest security report by **MongoDB agent ObjectId** |
| GET | `/api/alerts` | List alerts |
| GET | `/api/alerts/:alertId` | Fetch alert by MongoDB ObjectId |
| POST | `/api/ai/analyze/:agentId` | Generate and store Gemini assessment by **MongoDB agent ObjectId** |
| GET | `/api/ai/history/:agentId` | Fetch saved analyses by **MongoDB agent ObjectId** |

The AI analyze endpoint uses the latest stored report and **does not require a JSON request body**. Do not confuse the human-readable `AGENT-001` with the MongoDB `_id` used by security and AI endpoints.

## Verify the setup

- `GET /api/system/health` responds successfully.
- The agent terminal shows successful registration and report upload.
- The **Devices** page shows the registered endpoint.
- The **Security** page shows a recent report, including firewall, ports, services, and failed-login information.
- The AI action generates a response when a valid Gemini API key is configured.
- AI history shows saved analyses for the selected endpoint.

The frontend refreshes security status every **30 seconds**. The agent also defaults to a **30-second** reporting interval; these are separate settings.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Backend fails to start | MongoDB is running and `backend/.env` contains a valid `MONGODB_URI` |
| Browser cannot load agents | Backend is running, `VITE_API_BASE_URL` ends in `/api`, and `FRONTEND_URL` matches the frontend's exact origin |
| Agent keeps retrying registration | `API_BASE_URL` points to a reachable backend, port 5000 is allowed on the trusted network, and each agent has a unique `AGENT_ID` |
| No security report appears | Keep the agent running; check its terminal for upload errors and wait for the next monitoring cycle |
| AI analysis fails | Check `GEMINI_API_KEY`, Gemini API availability/quota, and that the selected agent already has a report |
| Failed-login count unavailable | OS event-log permissions or required logging facilities may be missing; `null` is not the same as zero |
| Frontend port differs from 5173 | Use the actual Vite URL and update `FRONTEND_URL` in the backend configuration |
| Port 5000 already in use | Change backend `PORT` and update both frontend and agent API base URLs |
| PowerShell blocks virtual environment activation | Use Command Prompt activation or adjust PowerShell's execution policy according to your local policy |

## Platform limitations

- The agent recognizes **Windows**, **Linux**, and **macOS**, but checks vary by operating system. Some macOS checks are unsupported and may return unavailable or fallback values.
- Firewall and service detection depend on local commands, OS configuration, and permissions.
- Failed-login detection examines a **30-second** window, using Windows Security Event ID 4625 or Linux journal messages. It may be unavailable if access is denied.
- A listening port alone does **not** establish internet exposure or identify a confirmed vulnerability.
- AI-generated assessments may be incomplete or incorrect; verify recommendations before changing endpoint settings.
- The current API has **no implemented authentication/authorization for agents or dashboard users**. Do not expose it directly to the public internet or run it on an untrusted network without additional security controls.

## Security and repository hygiene

- Keep `.env` files private. If a real Gemini key or database password has been shared publicly, **rotate it**.
- Do not commit `node_modules/`, `agent/venv/`, `.venv/`, build outputs, or `.git/` inside release archives.
- If secrets were ever committed, removing the files from the latest commit does **not** remove them from Git history. Rotate compromised credentials and review history before publishing.
- The agent collects security-relevant machine metadata. Run it only on computers you own or are authorized to monitor.

## Development commands

```bash
# Backend
cd backend
npm run dev

# Frontend (separate terminal)
cd frontend
npm run dev

# Optional frontend checks
npm run lint
npm run build

# Agent (separate terminal, after venv setup)
cd agent
python agent.py
```

## License

The uploaded repository does not contain a root `LICENSE` file. Add a license before describing this project as open source or granting reuse permissions.
