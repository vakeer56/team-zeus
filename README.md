# Evalix — Proctored Assessment Platform

(PS- 003) A proctored online assessment platform for technical hiring. Recruiters publish timed MCQ and coding assessments; candidates take them in a Monaco-powered code editor while the platform passively logs integrity signals (tab switches, copy/paste, fullscreen exits) and generates an AI-assisted risk report from that activity.

Evalix is a secure, AI-powered technical assessment platform. Recruiters create and publish timed evaluations; candidates complete them in an isolated sandbox environment under continuous integrity monitoring.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Running Tests](#running-tests)
- [Login Credentials](#login-credentials)
- [Team](#team)

---

## Tech Stack

**Frontend**

| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State management | Zustand |
| Forms & validation | React Hook Form + Zod |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Code execution (client-side call) | Wandbox API (`wandbox.org/api/compile.json`) |
| Animation | Framer Motion |
| HTTP | native `fetch` via a shared `apiUrl()` helper (Axios is installed but unused) |
| Real-time | socket.io-client |
| Notifications | react-hot-toast |
| Linting | oxlint |

**Backend**

| Category | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| Database | MongoDB via Mongoose |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Real-time | Socket.io |
| AI Analysis | Google Gemini (`gemini-2.5-flash`) + Groq (`llama-3.3-70b-versatile`) |
| Testing | Jest + Supertest + mongodb-memory-server |

---

## Prerequisites

- **Node.js** v20+
- **npm**
- **MongoDB** — local or [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- **Gemini API Key** — [Google AI Studio](https://aistudio.google.com/)
- **Groq API Key** — [Groq Console](https://console.groq.com/)

---

## Installation & Setup

```bash
git clone https://github.com/vakeer56/team-zeus.git
cd team-zeus
```

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd ../client
npm install
```

---

## Environment Variables

### `server/.env`

```env
# MongoDB connection string (required)
DB_URL=your_mongodb_connection_string

# JWT signing secret — use a long, random string (required)
JWT_SECRET=your_jwt_secret_key

# Server port (optional, defaults to 3000)
PORT=3000

# Allowed CORS origins (comma-separated)
CORS_ORIGIN=http://localhost:5173

# Google Gemini — AI risk report analysis
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Groq — LLM explanation service
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

### `client/.env`

```env
VITE_API_URL=http://localhost:3000
```

> **Never commit `.env` files.** Both `.gitignore` files already exclude them.

---

## Running the Project

### Backend
```bash
cd server
npm run dev
```

### Frontend
```bash
cd client
npm run dev
```

The client is served at `http://localhost:5173` by default.

---

## Running Tests

```bash
cd server
npm test
```

The suite runs against an in-memory MongoDB instance — no external database required.

---

## Login Credentials

The following accounts are pre-seeded and available for evaluation:

| Role | Email | Password |
|---|---|---|
| Recruiter | `recruiter@recruiter.evalix.com` | `SecurePassword123` |
| Candidate | `venky@gmail.com` | `asdfghjkl;'` |

> These accounts exist in the shared deployment database for demo and evaluation purposes.

---

## Team

**Team Zeus** — System Siege

| Name | Role |
|---|---|
| _Varun M_ | _Leader / Backend Developer_ |
| _Ponnu Raj_ | _Backend Developer / Frontend Developer_ |
| _Aakash Raj_ | _Backend Developer / Frontend Developer_ |
| _Krishsudharsun_ | _Security Developer / Tester_ |

_Add team member names and contact details before final submission._
