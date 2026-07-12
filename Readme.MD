# Holdit

**Know who holds what. Always.**

Holdit is an enterprise asset and resource management platform — a centralized
ERP module for tracking physical assets and shared resources through their full
lifecycle: registration, allocation, transfer, booking, maintenance approval,
and audit cycles. Built for any organization with equipment, furniture,
vehicles, or shared spaces (offices, schools, hospitals, factories, agencies).

Built solo in 8 hours for the Odoo Hackathon.

---

## Contents

- [Overview](#overview)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Core modules](#core-modules)
- [User roles and permissions](#user-roles-and-permissions)
- [Asset lifecycle](#asset-lifecycle)
- [Business rules enforced](#business-rules-enforced)
- [Database design](#database-design)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Project structure](#project-structure)
- [Validation approach](#validation-approach)
- [Security](#security)
- [Trade-offs and what's next](#trade-offs-and-whats-next)
- [Demo script](#demo-script)

---

## Overview

Organizations tracking assets with spreadsheets and paper logs run into the
same problems: nobody can say who currently holds an item, double-bookings of
shared rooms and equipment go unnoticed until they collide, repairs get
raised informally and forgotten, and periodic stock checks turn into a
scramble. Holdit centralizes all of it — one system of record for what
exists, who holds it, its condition, and its full history.

The platform deliberately stays out of purchasing, invoicing, and accounting.
It focuses on lifecycle, allocation, booking, and maintenance — done well.

## How it works

![Holdit system workflow](docs/holdit-system-workflow.png)

Setup happens once (departments, categories, roles); everything after that
is the day-to-day loop of registering assets and running them through
allocation, booking, or maintenance, with audits catching discrepancies and
the dashboard surfacing it all in real time.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Drag and drop | dnd-kit |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | bcrypt password hashing + JWT, custom RBAC middleware |

No third-party backend-as-a-service (no Firebase, Supabase, or Mongo) and no
external APIs — the app runs fully offline against a local PostgreSQL
instance.

## Core modules

- **Organization setup** — departments (with hierarchy), asset categories
  (with category-specific fields), and the employee directory
- **Asset registry** — registration with auto-generated tags, QR lookup,
  search and filter by tag, serial number, category, status, department, or
  location; full per-asset allocation and maintenance history
- **Allocation and transfer** — assign assets to employees or departments,
  block double-allocation, route conflicting requests through a transfer
  workflow, track returns with condition notes
- **Resource booking** — time-slot booking of shared/limited resources with
  overlap validation and a calendar view
- **Maintenance management** — repair requests routed through an approval
  workflow before work begins, presented as a drag-and-drop kanban board
- **Audit cycles** — scoped verification cycles with assigned auditors,
  auto-generated discrepancy reports, and cycle closing that updates asset
  statuses
- **Dashboard and reports** — live KPIs, overdue alerts, utilization and
  maintenance-frequency analytics, CSV export
- **Notifications and activity log** — every assignment, approval, booking,
  and discrepancy tracked and surfaced without digging

## User roles and permissions

| Role | Can do |
|---|---|
| Employee (default on signup) | View assets allocated to them, book shared resources, raise maintenance requests, initiate returns/transfers |
| Department Head | View department assets, approve allocation/transfer requests within their department, book resources for the department |
| Asset Manager | Register and allocate assets, approve transfers, approve maintenance requests and audit discrepancy resolutions, approve returns |
| Admin | Manage departments, categories, and audit cycles; the only role that can promote an Employee to Department Head or Asset Manager; view org-wide analytics |

Signup always creates an Employee account — there is no role selector at
signup. Roles are only ever assigned by an Admin from the Employee Directory,
so no account can self-elevate its own permissions.

## Asset lifecycle

![Holdit asset lifecycle](docs/holdit-asset-lifecycle.png)

Every asset moves through a guarded state machine — only meaningful
transitions are allowed (a disposed asset, for example, can never be
allocated again). Reserved is a deliberate intermediate state: a transfer
being approved moves an asset to Reserved until the new holder confirms
pickup, rather than jumping straight to Allocated.

## Business rules enforced

- **Asset tags** are auto-generated and sequential (`AF-0001`) — never
  user-entered.
- **Allocation conflict rule**: an asset already allocated cannot be
  allocated again. The system blocks the action, shows who currently holds
  it, and offers a Transfer Request instead of a dead end.
- **Transfer workflow**: Requested → Approved → Reallocated, with allocation
  history updated automatically.
- **Booking overlap validation**: two bookings overlap if
  `new.start < existing.end AND new.end > existing.start` — a 9:00–10:00
  booking blocks a 9:30–10:30 request but allows a 10:00–11:00 request.
- **Maintenance workflow**: Pending → Approved/Rejected → Technician Assigned
  → In Progress → Resolved. The asset's status flips to Under Maintenance the
  moment a request is approved, and back to Available the moment it's
  resolved — as a side effect of the action, not a manual follow-up step.
- **Audit cycles**: closing a cycle locks it and updates asset statuses —
  confirmed-missing items become Lost.
- **Overdue allocations** are computed on read (expected return date passed,
  allocation still active), not tracked via a separate stored status or cron
  job, so they can never drift out of sync.

## Database design

Local PostgreSQL, modeled with Prisma. Key tables: `users`, `departments`,
`asset_categories`, `assets`, `allocations`, `transfer_requests`, `bookings`,
`maintenance_requests`, `audit_cycles`, `audit_items`, `activity_logs`,
`notifications`.

**Entity-relationship diagram:** `docs/holdit-erd.png` — generated from the
live Prisma schema (`npx prisma-erd-generator` or equivalent).

### Enforced at the database level, not just the API

- `UNIQUE` constraint on `asset_tag` and `email`
- Partial unique index allowing only one active allocation per asset:
  ```sql
  CREATE UNIQUE INDEX one_active_allocation
  ON allocations(asset_id) WHERE status = 'active';
  ```
- Booking inserts run inside a transaction alongside the overlap check, so a
  race condition can't create two overlapping bookings even under concurrent
  requests
- Indexes on `assets(status)`, `allocations(expected_return_date)`, and
  `bookings(asset_id, start_time)` for the queries the dashboard and booking
  calendar run most often

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

### Setup

```bash
git clone <repo-url>
cd holdit

# Backend
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npm run seed            # loads demo accounts and sample data
npm run dev

# Frontend, in a second terminal
cd client
npm install
npm run dev
```

### Environment variables (`server/.env`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/holdit
JWT_SECRET=<generate a random string>
PORT=4000
```

## Demo accounts

Seeded automatically by `npm run seed`, all using the password `Demo@123`:

| Role | Email |
|---|---|
| Admin | admin@holdit.app |
| Asset Manager | manager@holdit.app |
| Department Head | head@holdit.app |
| Employee | employee@holdit.app |

## Project structure

```
holdit/
├── server/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/       # business rules: conflict checks, overlap checks,
│   │                    # status transitions — kept out of route handlers
│   ├── middleware/      # auth, RBAC, validation
│   └── prisma/
├── client/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   └── api/
└── docs/
    ├── holdit-system-workflow.png
    ├── holdit-asset-lifecycle.png
    └── holdit-erd.png
```

## Validation approach

Two layers, both required:

- **Field level**, inline, on blur — email format, required fields, positive
  costs, end time after start time, dates not in the past. Errors surface
  under the field immediately, not on submit.
- **Business level** — the conflict, overlap, and transition rules above,
  validated server-side with specific messages (never a generic "something
  went wrong"), so the UI can never be bypassed by calling the API directly.

## Security

- Passwords hashed with bcrypt, sessions via JWT
- Role-based access control enforced in middleware on every route, not just
  hidden in the UI
- Login attempt counter — account locks after 5 failed attempts
- No client can self-assign a role; promotion is Admin-only and audited via
  the activity log

## Trade-offs and what's next

Deliberate scope decisions made for an 8-hour solo build, not oversights:

- Audit cycles support a single auditor per cycle; the schema (a join table)
  supports multiple auditors and would be a small addition
- Document and photo attachments are stored as filenames/URLs rather than a
  full file storage pipeline
- Reports cover utilization and maintenance frequency; the full analytics
  suite (booking heatmaps, most-used/idle breakdowns) is a natural next step
- Notifications are in-app only; email delivery would be the next addition

## Demo script

1. Land on the sign-in page — note signup creates an Employee account only,
   no role picker
2. As Admin, promote that employee to a role from the Employee Directory —
   the only place roles are assigned
3. As Asset Manager, register an asset — QR code generates, search by it
4. Try to allocate an asset that's already held — blocked, shows who holds
   it, offers a Transfer Request; approve it and watch the history update
5. Book a resource for 9:00–10:00, then try 9:30–10:30 — rejected; try
   10:00–11:00 — accepted
6. Drag a maintenance card from Pending to Approved — the asset's status
   flips to Under Maintenance live; drag it to Resolved — back to Available
7. Mark an asset Missing in an audit cycle and close the cycle — it becomes
   Lost
8. Return to the dashboard — every KPI, notification, and log entry reflects
   everything that just happened