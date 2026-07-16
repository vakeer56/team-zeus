# Evalix

A proctored online assessment platform for technical hiring. Recruiters publish timed MCQ and coding assessments; candidates take them in a Monaco-powered code editor while the platform passively logs integrity signals (tab switches, copy/paste, fullscreen exits) and generates an AI-assisted risk report from that activity.

**Team:** Team Zeus
**Repository:** https://github.com/vakeer56/team-zeus
**Built for:** System Siege — Systems-Focused Engineering Hackathon

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Running Tests](#running-tests)
- [Seeded Login Credentials](#seeded-login-credentials)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Real-Time Events (Socket.io)](#real-time-events-socketio)
- [Known Limitations](#known-limitations)
- [Security Self-Testing Guide](#security-self-testing-guide)
- [Roadmap](#roadmap)
- [Team](#team)

---

## Overview

Evalix has three user roles — **admin**, **recruiter**, and **candidate** — and two independently deployed pieces:

- **Client** (`/client`): a React SPA with separate login flows for candidates and recruiters, a recruiter dashboard for creating/publishing assessments and reviewing submissions, and a candidate-facing timed assessment page with a Monaco code editor and live proctoring hooks.
- **Server** (`/server`): a REST API (Express) backed by MongoDB, with JWT authentication, Zod request validation, rate limiting, Socket.io for live dashboard updates, and an AI-report service that scores proctoring activity via Gemini and Groq.

## Tech Stack

**Frontend (`/client`)**

| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
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

**Backend (`/server`)**

| Category | Technology |
|---|---|
| Runtime / framework | Node.js + Express 5 |
| Database | MongoDB via Mongoose |
| Auth | JSON Web Tokens (`jsonwebtoken`) + bcrypt password hashing |
| Validation | Zod |
| Rate limiting | express-rate-limit |
| Real-time | Socket.io |
| AI risk scoring | Google Gemini API + Groq API (combined) |
| Testing | Jest + Supertest + mongodb-memory-server |

**Deployment**
- `client/vercel.json` deploys `/client` as a static SPA build (with a catch-all rewrite to `index.html`).
- The client resolves its API base URL at runtime via `VITE_API_URL`, falling back to `http://localhost:3001` on localhost or `https://team-zeus.onrender.com` otherwise (`client/src/config/api.ts`).
- The server is deployed separately (e.g. Render/Railway) — it is not part of the Vercel build.

## Architecture

```
                 ┌──────────────────────────┐
                 │   Client (Vite, React)    │
                 │  candidate & recruiter UI │
                 └─────────────┬─────────────┘
                                │ fetch() + Socket.io — JWT Bearer token
                                ▼
                 ┌──────────────────────────┐
                 │    Server (Express 5)     │
                 │ ──────────────────────── │
                 │ auth · assessments        │
                 │ submissions · proctoring  │
                 │ reports (AI risk scoring) │
                 └──────┬─────────────┬──────┘
                        │             │
              Mongoose  │             │  Gemini + Groq APIs
                        ▼             ▼
                 ┌──────────────┐  ┌──────────────────┐
                 │   MongoDB     │  │  AI report service │
                 │ Users/Assess- │  │ (risk score+flags) │
                 │ ments/Submis- │  └──────────────────┘
                 │ sions/Proctor │
                 │ Events        │
                 └──────────────┘
```

## Project Structure

```
team-zeus/
├── client/                        # React + Vite frontend
│   ├── vercel.json                 # Deploys /client as a static build
│   └── src/
│       ├── components/             # Navbar, Footer
│       ├── config/api.ts           # API_BASE_URL / apiUrl() helper
│       ├── pages/
│       │   ├── LandingPage.tsx
│       │   ├── CandidateLoginPage.tsx
│       │   ├── CandidateDashboard.tsx / RecruiterDashboard.tsx
│       │   ├── CreateAssessmentPage.tsx
│       │   ├── AddRecruiterPage.tsx
│       │   ├── ProfilePage.tsx / RecruiterProfilePage.tsx
│       │   └── AssessmentPage.tsx  # Timed test-taking UI + proctoring hooks
│       ├── App.tsx                 # Route definitions
│       └── main.tsx
│
└── server/                        # Express backend
    ├── app.js                     # Entry point: DB connect + HTTP + Socket.io listen
    ├── create-recruiter.js        # One-off script: seeds a recruiter account
    ├── seed-assessment.js         # One-off script: seeds a sample assessment
    ├── src/
    │   ├── app.js                  # Express app (routes/middleware), imported by tests
    │   ├── config/db.js
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   ├── assessment.controller.js
    │   │   ├── submissionController.js
    │   │   ├── proctorEventController.js
    │   │   ├── reportController.js
    │   │   └── aiReportController.js   # thin alias over reportController
    │   ├── middleware/
    │   │   ├── authenticate.js         # authenticate + authorize(...roles)
    │   │   └── validateRequestBody.js  # generic Zod body validator
    │   ├── models/
    │   │   ├── user.model.js
    │   │   ├── assessment.model.js
    │   │   ├── submission.model.js
    │   │   └── proctorEvent.model.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── assessment.routes.js
    │   │   ├── submissionRoutes.js
    │   │   ├── proctorRoutes.js
    │   │   └── reportRoutes.js
    │   ├── services/aiReport.service.js  # Gemini + Groq risk-scoring calls
    │   ├── validators/assessment.schema.js
    │   ├── seed/scripts.js             # Guarded dev/test-only seed script
    │   └── utils/                      # ApiError, jwt helpers, sanitizeAssessment
    └── tests/                          # Jest + Supertest test suites
```

## Prerequisites

- **Node.js** v20+ (confirmed working on Node 22)
- **npm**
- **MongoDB** — local instance (v6+) or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- **Git**
- API keys for **Gemini** and **Groq** if you want AI risk-report generation to work (optional for everything else)

## Installation & Setup

```bash
git clone https://github.com/vakeer56/team-zeus.git
cd team-zeus
```

### 1. Server

```bash
cd server
npm install
```

Create `server/.env` — see [Environment Variables](#environment-variables).

### 2. Client

```bash
cd ../client
npm install
```

Create `client/.env` (optional locally, **required for a production deploy**):

```env
VITE_API_URL=http://localhost:3000
```

If unset, the client falls back to `http://localhost:3001` on `localhost`, or `https://team-zeus.onrender.com` everywhere else — see `client/src/config/api.ts`. Set `VITE_API_URL` explicitly to match wherever your server is actually running/deployed.

### 3. (Optional) Seed data

```bash
cd ../server
node create-recruiter.js   # creates admin@recruiter.evalix.com
node seed-assessment.js    # creates a sample published assessment
```

## Environment Variables

Create `server/.env`:

```env
# MongoDB connection string (required)
DB_URL=mongodb://localhost:27017/evalix

# Secret used to sign JWTs — use a long, random string in production (required)
JWT_SECRET=replace-with-a-strong-random-secret

# Port the Express server listens on (optional, defaults to 3000)
PORT=3000

# Comma-separated list of allowed CORS origins (optional — falls back to
# localhost:5173 and a hardcoded Vercel preview URL if unset)
CORS_ORIGIN=http://localhost:5173

# Required only for AI proctoring-risk reports (POST /reports/submissions/:id/generate)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# Only required if you run the guarded seed script (server/src/seed/scripts.js)
# Must point at a DB name ending in "-dev" or "-test" as a safety guard
SEED_DB_URL=mongodb://localhost:27017/evalix-dev
```

Create `client/.env` (optional):

```env
VITE_API_URL=http://localhost:3000
```

> Recruiter accounts are created automatically by `/register` when the email ends in `@recruiter.evalix.com`. All other emails register as `candidate`. There's no self-service `admin` signup — see [Known Limitations](#known-limitations).

**Never commit `.env` files.** Both `client/.gitignore` and `server/.gitignore` already exclude them.

## Running the Project

### Backend

```bash
cd server
npm run dev     # nodemon app.js — auto-restarts on change
# or
npm start        # node app.js — single run
```

A healthy boot logs:
```
Connected to the database.
Server is running on port 3000.
```

### Frontend

```bash
cd client
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

### Production build (client)

```bash
cd client
npm run build     # tsc -b && vite build
npm run preview   # serve the production build locally
```

## Running Tests

The server test suite uses Jest + Supertest against an in-memory MongoDB instance (`mongodb-memory-server`) — no running MongoDB or `.env` file is required, but the **first run needs internet access** to download the MongoDB binary.

```bash
cd server
npm test          # runs `jest --runInBand`
```

Current coverage includes auth (register/login/verify-email/rate-limiting), assessment CRUD + authorization, proctoring-event logging, AI report generation, and a dedicated security-tests suite.

There is no automated test suite on the client yet.

## Seeded Login Credentials

These are created by the **optional** seed scripts above — they only exist in your own local/dev database once you run those scripts, and are **for local development and testing only**.

| Role | Email | Password | Created by |
|---|---|---|---|
| Recruiter | `recruiter@recruiter.evalix.com` | `SecurePassword123` | `server/src/seed/scripts.js` |
| Candidate | `venky@gmail.com` | `asdfghjkl;'` | `server/src/seed/scripts.js` |
| Candidate | `attacker@test.com` | `password123` | `server/src/seed/scripts.js` (used to test ownership/authorization bugs) |

There is no seeded `admin`-role account (see [Known Limitations](#known-limitations)); to test admin-only behavior, set a user's `role` field to `admin` directly in MongoDB.

> ⚠️ **Do not reuse these credentials, or ship the seed scripts, in any publicly deployed instance.** Rotate `JWT_SECRET` and remove/disable the seed and create-recruiter scripts before a real deployment.

## API Reference

Base URL: `http://localhost:3000` (or your configured `VITE_API_URL`)

### Auth — mounted at `/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Registers a candidate, or a recruiter if the email ends in `@recruiter.evalix.com`. Rate-limited: 10/hour/IP. |
| POST | `/login` | No | Returns a 15-minute JWT. Rate-limited: 8 attempts/15 min per IP+email. |
| GET | `/verify-email/:token` | No | Verifies email via the token issued at registration. |
| GET | `/me` | Yes | Returns the authenticated user's profile. |
| PUT | `/update-profile` | Yes | Updates name/email/password for the authenticated user. |
| POST | `/create-recruiter` | Yes (recruiter) | Lets an existing recruiter create another recruiter account (email must end in `@recruiter.evalix.com`). |

### Assessments — mounted at `/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/assessments` | admin, recruiter | Creates an assessment (`draft`/`published`/`archived`), validated against a strict Zod schema for MCQ/CODE question shapes. |
| GET | `/assessments` | Yes | Candidates see only `published` (or legacy `isActive`) assessments; admins/recruiters see all. |
| GET | `/assessments/:id` | Yes | Non-admin roles can only fetch it if `status === "published"` (see Known Limitations). |
| PUT | `/assessments/:id/make-live` | admin, recruiter | Sets `status` to `published` and emits an `assessment_created` Socket.io event. |
| PUT | `/assessments/:id` | admin, recruiter | Partial update of title/description/duration/difficulty/status/questions. |
| DELETE | `/assessments/:id` | admin, recruiter | Deletes an assessment. |

### Submissions — mounted at `/submissions`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | Yes | Starts (or resumes) a candidate's submission for an assessment. |
| GET | `/submissions` | Yes | Candidates see their own; recruiters see all (optionally filtered by `?assessmentId=`). |
| POST | `/submissions/:id/reauthorize` | Yes | Re-authorizes a candidate to continue a submission. |
| GET | `/submissions/:id` | Yes | Submission owner or a recruiter can view details + proctoring events. |
| PUT | `/submissions/:id` | Yes (owner only) | Updates answers/score/status; emits `submission_updated`. |
| GET | `/submissions/:id/ai-report` | Yes | Alias for `GET /reports/submissions/:id`. |
| POST | `/submissions/:id/ai-report/generate` | Yes | Alias for `POST /reports/submissions/:id/generate`. |

### Proctoring — mounted at `/proctor`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/proctor/submissions/:id/proctor-event` | candidate | Logs a proctoring event. Enforces ownership, `in_progress` status, and a 1 req/sec-per-submission rate limit. |

### Reports — mounted at `/reports`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/reports/submissions/:id` | admin, recruiter | Returns the stored AI risk report for a submission. |
| POST | `/reports/submissions/:id/generate` | admin, recruiter | Aggregates proctoring events, calls Gemini + Groq, stores and returns a combined risk report. |

All error responses follow `{ success: false, message: "..." }`.

## Data Models

**User** — `name`, `email` (unique), `password` (hashed, `select: false`), `role` (`admin` \| `recruiter` \| `candidate`), `isVerified`, `verificationToken`.

**Assessment** — `title`, `description`, `duration`, `difficulty` (`easy`\|`medium`\|`hard`), `status` (`draft`\|`published`\|`archived`), `createdBy`, `questions[]` (MCQ: `options`, `correctOptionIndex`; CODE: `starterCode`, `language`, `sampleTestCases`, `hiddenTestCases`).

**Submission** — `candidateId`, `assessmentId` (unique together), `answers[]` (per-question score + execution result/verdict), `totalScore`, `aiReport` (`riskScore`, `flags[]`, `generatedAt`), `status` (`in_progress`\|`submitted`\|`evaluated`\|`pending_reevaluation`).

**ProctorEvent** — `submissionId`, `candidateId`, `eventType` (`tab_switch`, `window_blur`, `paste_attempt`, `copy_attempt`, `fullscreen_exit`, `multiple_faces_detected`, `suspicious_activity`), `metadata`, server-stamped `createdAt`.

## Real-Time Events (Socket.io)

The server attaches Socket.io to the same HTTP server and exposes it via `req.app.get('io')`.

| Event | Emitted when | Payload |
|---|---|---|
| `assessment_created` | An assessment is made live (`PUT /assessments/:id/make-live`) | the updated assessment document |
| `submission_updated` | A submission is updated (`PUT /submissions/:id`) | the updated submission document |

Both events are broadcast to **all** connected clients (`io.emit`, not scoped to rooms) — any connected socket receives every update.

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

## Team

**Team Zeus** — System Siege

| Name | Role |
|---|---|
| _Varun M_ | _Leader / Backend Developer_ |
| _Ponnu Raj_ | _Backend Developer / Frontend Developer_ |
| _Aakash Raj_ | _Backend Developer / Frontend Developer_ |
| _Krishsudharsun_ | _Security Developer / Tester_ |

_Add team member names and contact details before final submission._
