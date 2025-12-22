# Shared Costing API

A TypeScript-powered Express API for running a shared expense platform with house management, receipt storage, analytics dashboards, collaborative notes and even cricket player stat scraping. The service is built for teams who need to track who paid what, balance costs fairly and keep everyone notified in real-time.

---

## Contents

1. [Features](#features)
2. [System Overview](#system-overview)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Available Scripts](#available-scripts)
6. [Project Structure](#project-structure)
7. [API Surface](#api-surface)
8. [Monitoring & Notifications](#monitoring--notifications)
9. [Development Notes](#development-notes)

---

## Features

- **Authentication & Onboarding** – Email-based registration, activation workflows, login via username or email, password recovery and JWT secured session management.
- **House Management** – Create or join houses with unique codes, maintain member lists, manage time zones and currencies, and gate access with role-aware middleware.
- **Expense Tracking** – Attach receipts (Cloudinary-backed storage), select categories, split costs between house members and keep historical records with audit-friendly metadata.
- **Store Directory** – Curate frequently used stores with images so expenses are easier to classify and visualize later.
- **Analytics Dashboards** – Aggregations for weekly spending, rolling six-month comparisons, category/store insights and contribution breakdowns per house member.
- **Collaborative Notes & Todos** – Lightweight task boards scoped to a house so occupants can coordinate chores, shopping lists or follow-ups.
- **Player Stats Scraper** – Secure Puppeteer job that ingests cricket stats into MongoDB (guarded by a scraper token) for the associated companion apps.

---

## System Overview

- **Runtime:** Node.js + Express, written entirely in TypeScript.
- **Database:** MongoDB via Mongoose schemas for users, houses, expenses, notes, stores and cricket stats.
- **Authentication:** JWT tokens enforced through middleware. Activation and recovery emails handled with Nodemailer + Gmail.
- **File Storage:** Multer + Cloudinary for user avatars, store logos and receipt images (served via CDN-ready URLs).
- **Analytics:** MongoDB aggregation pipelines with house-aware time zone handling supplied by `moment-timezone`.
- **Automation:** Puppeteer-driven scraping jobs for cricket statistics, invoked through protected endpoints.
- **Deployment Ready:** `npm run build` compiles assets to `/dist`, while `npm run start` can execute via `ts-node` (swap to node + compiled output in production if preferred).

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create an `.env` file** using [Environment Variables](#environment-variables).

3. **Run MongoDB**
   - Local: `mongod --dbpath <path>` or via Docker (`docker run -p 27017:27017 mongo`).
   - Remote: Provide a cloud connection string in `MONGODB_URI`.

4. **Start the API**
   ```bash
   npm run dev
   ```
   The server listens on `0.0.0.0:${PORT}` (defaults to `3000`) and exposes routes under `/api/*`.

> **Tip:** For production, build with `npm run build` and launch with a process manager (PM2, Docker, systemd) using the compiled JavaScript.

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Port the HTTP server binds to | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shared-costing` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account identifier | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdef` |
| `APP_URL` | Backend base URL (used in transactional emails) | `https://api.example.com` |
| `FRONTEND_URL` | Frontend base URL for deep links & CORS | `https://app.example.com` |
| `APP_EMAIL` | Gmail account used by Nodemailer | `notifications@example.com` |
| `APP_PASSWORD` | App password for the Gmail sender | `xxxx xxxx xxxx xxxx` |
| `LOGO_URL` | Public image URL injected into emails | `https://cdn.example.com/logo.png` |
| `SCRAPER_SECRET` | Bearer token that unlocks scraping endpoints | `very-secret-token` |

> **Gmail setup:** enable 2FA and use an app password, or switch the transporter configuration to a custom SMTP provider.

---

## Available Scripts

- `npm run dev` – Run the TypeScript sources with `ts-node` + `nodemon` for hot reloading.
- `npm run start` – Launch the API with `ts-node` (suitable for quick staging environments).
- `npm run build` – Transpile TypeScript into `/dist` for production use.
- `npm test` – Placeholder (returns an error). Add Jest/Vitest when automated tests are introduced.

---

## Project Structure

```text
src/
├── controllers/     # Business logic for auth, expenses, houses, notes, stores, charts, players
├── routes/          # Express routers organised by domain (all mounted under /api/*)
├── models/          # Mongoose schemas and enums
├── middlewares/     # JWT auth, authorization guards, scraper token checks
├── helpers/         # Cryptographic utilities
├── utils/           # Shared helpers (e.g., time zone conversions)
└── index.ts         # Express bootstrap (CORS, compression, static assets, route mounting)
docs/api/            # Hand-authored reference for select REST endpoints
uploads/             # Local receipt/avatar storage (legacy fallback to Cloudinary)
receipts/            # Example assets for development
```

The repository is TypeScript-first—compilation outputs live in `/dist` once you run `npm run build`.

---

## API Surface

High-level overview of the modules exposed beneath `/api`:

- **Auth (`/api/auth`)** – Registration, activation, login, password reset and account verification workflows. Cloudinary-backed avatar uploads are supported during sign-up.
- **Houses (`/api/houses`)** – Create, update, delete and join houses. Includes invite-approval emails, membership lookups and currency/timezone settings.
- **Expenses (`/api/expenses`)** – CRUD endpoints plus extensive reporting: weekly/monthly/yearly breakdowns, house balance calculations and CSV-friendly summaries. Receipts upload directly to Cloudinary.
- **Charts (`/api/chart`)** – Aggregated analytics for category trends, store spending, multi-month comparisons, member contributions and per-user benchmarks (all time zone aware).
- **Stores (`/api/stores`)** – Manage frequently used store metadata and expose a lightweight directory for the frontend.
- **Users (`/api/user`)** – Owner/admin-guarded endpoints to view, update or deactivate accounts; supports avatar updates and password changes.
- **Notes (`/api/notes`)** – House-scoped collaborative notes & todos with status tracking.
- **Players (`/api/players`)** – Protected scraping endpoints (Puppeteer) plus read access for stored cricket matches and player statistics.
- **Password Reset (`/reset-password`)** – Non-API route used by email templates for browser redirects.

Detailed request/response payloads live in `docs/api/*.md`; update those documents alongside controller changes to keep the reference current.

---

## Monitoring & Notifications

- **Email Alerts:** Every critical flow (account activation, password reset, join-house requests, expense notifications) sends templated HTML emails through Nodemailer.
- **Receipts & Imagery:** Uploaded files are transformed by Cloudinary (quality + format auto-optimised). The service still serves `/uploads` for backward-compatibility with earlier local storage.
- **Scraping Jobs:** The cricket ingestion endpoints require a bearer token (`Authorization: Bearer <SCRAPER_SECRET>`) to prevent abuse. Puppeteer runs headless with hardened launch arguments for container compatibility.

---

## Development Notes

- **Authentication:** Almost every router registers `authMiddleware` first; ensure frontend calls include `Authorization: Bearer <JWT>`.
- **Authorisation:** Additional guards (`checkExpenseDeleteEditRights`, `checkHouseOwnership`, `isAdmin`, etc.) prevent cross-house access and enforce role-based rules.
- **Time Zones:** House entities store a preferred `timeZone`; chart endpoints convert Mongo dates using `moment-timezone` so results align with the house locale.
- **Data Hygiene:** House codes cascade into user, expense and note documents. The controllers take care of fan-out updates when codes or memberships change—review those routines before altering schemas.
- **Docs:** When you extend the API, update both the relevant controller and `docs/api` file to keep human-readable documentation accurate.
- **Testing:** Automated tests are not yet wired in. Add integration tests with Supertest or e2e coverage with a lightweight in-memory Mongo harness before broad feature work.

---

Happy hacking! When in doubt, start the server with `npm run dev`, curl an `/api/*` endpoint with a valid JWT and iterate against the TypeScript controllers. Contributions are welcome—just keep the email templates fancy and the housemates happy.

