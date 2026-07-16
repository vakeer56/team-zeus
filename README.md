# Evalix — Proctored Assessment Platform

A proctored online assessment platform for technical hiring. Recruiters publish timed MCQ and coding assessments; candidates take them in a Monaco-powered code editor while the platform passively logs integrity signals (tab switches, copy/paste, fullscreen exits) and generates an AI-assisted risk report from that activity.

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

<<<<<<< HEAD
## Known Limitations

Documented honestly, per the hackathon's submission guidelines:

- **Candidates can self-report their own score:** `PUT /submissions/:id` only checks that the requester *owns* the submission — it doesn't restrict who may set `totalScore` or move `status` to `submitted`/`evaluated`. A candidate can currently grade their own attempt via the API.
- **Recruiters can't view or manage their own draft assessments individually:** `GET /assessments/:id` only bypasses the `published`-only filter for `role === "admin"`; `recruiter` is not included, even though recruiters are the ones allowed to create and publish assessments.
- **Recruiters can't see their own answer keys:** `sanitizeAssessment` strips `correctOptionIndex` and `hiddenTestCases` for every role except `admin`.
- **No ownership check on assessment edit/delete:** any authenticated `admin` or `recruiter` can update or delete *any* assessment, not just ones they created.
- **No code execution on the server:** Python code questions are compiled/run by calling the third-party Wandbox API directly **from the browser** (`AssessmentPage.tsx`), not through the backend. There's no server-side sandboxing, rate limiting, or result verification — a candidate could tamper with the client-reported result before it's sent to `PUT /submissions/:id`.
- **Socket.io events are unscoped:** `assessment_created` and `submission_updated` are broadcast to every connected socket with no rooms/namespaces, so any logged-in client (candidate or recruiter) receives every other user's submission updates.
- **No refresh-token flow:** JWTs expire after 15 minutes with no renewal mechanism.
- **In-memory rate limiting:** login/register limiters and the proctoring-event limiter store state in-process, so they reset on restart and don't work correctly across multiple server instances.
- **No admin account seeding:** `role: "admin"` exists in the schema and is used in several authorization checks, but nothing in `/register` or the seed scripts creates one — it must be set manually in the database.
- **`GET /reports/submissions/:id` and `GET /submissions/:id/ai-report`** are two different URLs for the same underlying handler (`reportController.getReport`) — harmless, but worth knowing if calling the API directly.
- **Client dev vs. prod default port mismatch:** `client/src/config/api.ts` defaults to `http://localhost:3001` on localhost, while the server defaults to port `3000`. Set `VITE_API_URL` explicitly, or align the two, to avoid confusion.
=======
---
>>>>>>> 505b9e0 (docs: documentation modification)

## Team

**Team Zeus** — System Siege

| Name | Role |
|---|---|
<<<<<<< HEAD
| _Varun M_ | _Leader / Backend Developer_ |
| _Ponnu Raj_ | _Backend Developer / Frontend Developer_ |
| _Aakash Raj_ | _Backend Developer / Frontend Developer_ |
| _Krishsudharsun_ | _Security Developer / Tester_ |

_Add team member names and contact details before final submission._
=======
| Varun | Team Lead / Backend Developer |
| Ponnu Raj | Backend Developer / Frontend Developer |
| Akash Raj | Backend Developer / Frontend Developer |
| Krishsudharsun | Security Developer / Tester |
>>>>>>> 505b9e0 (docs: documentation modification)
