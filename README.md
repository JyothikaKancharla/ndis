# NDIS Support Services Management System

## Overview

The **NDIS Support Services Management System** is a full-stack web application built to streamline operations for **National Disability Insurance Scheme (NDIS)** care providers in Australia.

It provides a role-based platform for support staff, supervisors, and administrators to manage shifts, client notes, appointments, travel logs, and compliance documentation — all in one place.

This document covers:

1. System Architecture
2. Design Principles and Patterns
3. Technology Stack and Decisions
4. Features by Role
5. API Overview
6. Local Setup Guide
7. Folder Structure
8. Security and Compliance

---

## 1. Architecture Overview

### High-Level Architecture

```
Browser
   ↓
React SPA (Client-Side Rendered)
   ↓
React Router DOM v7 (Client Routing)
   ↓
Axios / Socket.io Client (HTTP + WebSocket)
   ↓
Express.js REST API + Socket.io Server
   ↓
MongoDB (via Mongoose ODM)
```

### Architecture Type

- Full-Stack Web Application
- Client-Side Rendered (CSR) React Frontend
- RESTful Node.js/Express Backend
- Real-time WebSocket support via Socket.io
- MongoDB NoSQL Database

---

## 2. Architectural Layers

### Frontend Layers

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| Presentation | `pages/`, `components/` | UI rendering, layout, user interaction |
| Application | `api/`, `context/` | API calls, state management |
| Domain | `constants/`, `hooks/` | Business rules, reusable logic |
| Utility | `utils/` | Helper functions |

### Backend Layers

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| Routing | `routes/` | HTTP endpoint definitions |
| Controller | `controllers/` | Request handling, business logic |
| Domain | `models/` | MongoDB schemas and data contracts |
| Middleware | `middleware/` | Auth, validation, audit, immutability |
| Utility | `utils/` | PDF/Excel generation, note analysis |

---

## 3. Design Patterns Followed

### 1. Role-Based Access Control (RBAC)
Three roles — `staff`, `supervisor`, `admin/government` — each with distinct permissions enforced at the middleware level.

### 2. Separation of Concerns
UI logic is strictly separated from business logic. API calls are abstracted in `api/` and `controllers/`.

### 3. Immutability Pattern
Verified notes become immutable. Supervisors must explicitly unlock them with a reason before any edit is possible.

### 4. Audit Trail Pattern
All significant operations (create, update, delete) are logged with user, timestamp, and action via `auditLog.js` middleware.

### 5. Real-Time Notification Pattern
Socket.io broadcasts live assignment status updates to active staff every 60 seconds.

### 6. Service Abstraction
All external API communication from the frontend flows through `api/api.js` — no direct fetch calls inside components.

---

## 4. Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Library | React 19 | Component rendering |
| Routing | React Router DOM v7 | Client-side routing |
| HTTP | Axios | API requests |
| WebSocket | Socket.io Client | Real-time updates |
| Animations | Framer Motion | UI transitions |
| Icons | Lucide React | Icon system |
| Styling | CSS Modules | Scoped component styles |
| Testing | Testing Library + Jest | Unit and integration tests |

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Server | Express.js 4 | REST API framework |
| Runtime | Node.js | JavaScript server runtime |
| Database | MongoDB + Mongoose | NoSQL data storage |
| Auth | JWT + bcryptjs | Secure token-based authentication |
| WebSocket | Socket.io | Real-time bidirectional events |
| File Upload | Multer | Image uploads (max 10MB, 5 files) |
| PDF Export | PDFKit | Generate shift/note PDF reports |
| Excel Export | ExcelJS | Export data to spreadsheets |
| Testing | Jest + Supertest | Backend unit and API tests |

---

## 5. Why These Technologies Were Chosen

### Why React?
- Component reusability across staff and supervisor dashboards
- Large ecosystem and mature tooling
- Context API handles lightweight global state (auth, recording)

### Why Express.js?
- Lightweight and flexible
- Fast development for REST APIs
- Large middleware ecosystem (Multer, JWT, CORS)

### Why MongoDB?
- Flexible schema for evolving note and assignment structures
- Natural document model for nested data (edit history, attachments)
- Mongoose ODM provides schema validation

### Why JWT Authentication?
- Stateless — no server-side session storage
- Embeds user role and identity in each token
- 8-hour expiry balances security and usability

### Why Socket.io?
- Real-time assignment status updates without polling
- Staff receive live shift notifications
- Easy room-based broadcasting per staff member

### Why CSS Modules?
- Component-scoped styles prevent class conflicts
- No additional CSS-in-JS runtime overhead
- Simple to maintain alongside JSX

---

## 6. Features by Role

### Staff
- View assigned clients and current shift
- Create notes: text, voice recording, or file attachments
- Edit draft notes before submission
- View daily consolidation timeline (merge multiple notes into one)
- Log trips with odometer readings for travel compliance
- Schedule and view client appointments
- Log incidents
- View full shift history

### Supervisor
- Assign staff to clients with specific shifts and pay rates
- Verify and approve submitted notes
- Unlock locked notes with an audit-logged reason
- Reject notes with written feedback
- View shift history and odometer records
- Create and manage client appointments
- Analyze note content via the NoteAnalysisPanel
- Manage staff assignment lifecycle

### Admin / Government
- System-level oversight dashboard
- Full audit trail visibility
- Export data to PDF and Excel

---

## 7. API Overview

### Auth Routes — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate and get JWT token |

### Staff Routes — `/api/staff`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff/clients` | Get assigned clients |
| GET | `/api/staff/notes` | Get all notes for staff |
| POST | `/api/staff/notes` | Create new note |
| PUT | `/api/staff/notes/:id` | Edit draft note |

### Supervisor Routes — `/api/supervisor`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/supervisor/notes` | View all submitted notes |
| PUT | `/api/supervisor/notes/:id/verify` | Verify/approve a note |
| PUT | `/api/supervisor/notes/:id/unlock` | Unlock a verified note |
| PUT | `/api/supervisor/notes/:id/reject` | Reject a note with reason |

### Assignment Routes — `/api/assignments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List all assignments |
| POST | `/api/assignments` | Create staff-to-client assignment |
| PUT | `/api/assignments/:id` | Update assignment |
| DELETE | `/api/assignments/:id` | Remove assignment |

### Other Routes

| Route Prefix | Description |
|-------------|-------------|
| `/api/clients` | Client CRUD |
| `/api/shifts` | Shift management |
| `/api/shift-history` | Historical shift records |
| `/api/note-analysis` | Note content analysis |

---

## 8. Authentication Flow

```
User Login
   ↓
POST /api/auth/login (email + password)
   ↓
Password verified via bcryptjs
   ↓
JWT generated (8-hour expiry)
   ↓
Token returned to frontend
   ↓
Frontend stores token → sends as "Authorization: Bearer <token>"
   ↓
Backend middleware verifies token on every protected route
   ↓
Role checked → access granted or denied (403)
```

### JWT Payload
```json
{
  "id": "user_id",
  "name": "Staff Name",
  "email": "staff@example.com",
  "role": "staff",
  "isActive": true
}
```

---

## 9. Real-Time Architecture (Socket.io)

```
Staff Browser connects → socket.emit("joinStaff", staffId)
   ↓
Server joins socket to room: staff_${staffId}
   ↓
Every 60 seconds → server fetches active assignments
   ↓
Server emits "assignmentStatus" → to all staff rooms
   ↓
Frontend receives update → UI refreshes without page reload
```

---

## 10. Key Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| Auth + RBAC | `auth.middleware.js` | Verify JWT, decode user, check role |
| Role Check | `roleCheck.js` | Role validation helper |
| Immutability | `immutability.js` | Block edits on verified/locked notes |
| Audit Log | `auditLog.js` | Log all write operations |
| File Upload | `upload.js` | Multer — images only, max 10MB, 5 files |
| Validate Shift | `validateShift.js` | Ensure shift times are valid |
| Validate Active Shift | `validateActiveShift.js` | Confirm staff is in an active shift |
| Validate Content | `validateContent.js` | Sanitize note text |

---

## 11. Running the Application

### Prerequisites

- Node.js >= 18
- npm
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Run backend:

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 12. Folder Structure

```
ndis/
├── backend/
│   └── src/
│       ├── config/              # MongoDB connection
│       ├── constants/           # Shift enums, status codes
│       ├── controllers/         # Business logic handlers
│       │   ├── auth.controller.js
│       │   ├── staff.controller.js
│       │   ├── supervisor.controller.js
│       │   ├── assignment.controller.js
│       │   ├── client.controller.js
│       │   ├── shiftHistory.controller.js
│       │   └── noteAnalysis.controller.js
│       ├── middleware/          # Express middleware
│       │   ├── auth.middleware.js
│       │   ├── auditLog.js
│       │   ├── immutability.js
│       │   ├── roleCheck.js
│       │   ├── upload.js
│       │   ├── validateShift.js
│       │   ├── validateActiveShift.js
│       │   └── validateContent.js
│       ├── models/              # Mongoose schemas
│       │   ├── User.js
│       │   ├── Client.js
│       │   ├── Note.js
│       │   ├── Assignment.js
│       │   ├── Appointment.js
│       │   ├── Trip.js
│       │   └── AuditLog.js
│       ├── routes/              # API route definitions
│       │   ├── auth.routes.js
│       │   ├── staff.routes.js
│       │   ├── supervisor.routes.js
│       │   ├── assignment.routes.js
│       │   ├── client.routes.js
│       │   ├── shifts.routes.js
│       │   ├── shiftHistory.routes.js
│       │   └── noteAnalysis.routes.js
│       ├── utils/               # Helpers
│       │   ├── assignmentStatus.js
│       │   ├── noteAnalyzer.js
│       │   ├── pdfGenerator.js
│       │   └── excelGenerator.js
│       ├── scripts/             # DB seeding utilities
│       ├── __tests__/           # Backend tests
│       ├── app.js               # Express app config
│       └── server.js            # HTTP + Socket.io server
│
├── frontend/
│   └── src/
│       ├── api/                 # HTTP + Socket communication
│       ├── components/
│       │   ├── common/          # Shared reusable components
│       │   ├── layout/          # Sidebar, DashboardLayout
│       │   ├── staff/           # Staff-specific components
│       │   └── supervisor/      # Supervisor-specific components
│       ├── context/             # AuthContext, RecordingContext
│       ├── pages/
│       │   ├── auth/            # Login, Signup
│       │   ├── staff/           # Staff dashboard and features
│       │   ├── supervisor/      # Supervisor dashboard and features
│       │   └── government/      # Admin/government dashboard
│       ├── constants/           # Shift definitions
│       ├── hooks/               # Custom React hooks
│       ├── utils/               # Helper functions
│       ├── __tests__/           # Frontend tests
│       ├── App.jsx              # Router and app entry
│       └── index.js             # React mount point
│
├── .gitignore
└── README.md
```

---

## 13. Compliance and Security

### NDIS Compliance Features
- **Immutable notes**: Verified notes cannot be altered without supervisor unlock and audit reason
- **Audit trail**: Every create/update/delete is logged with user, timestamp, and action
- **Edit history**: Notes store full edit history — editor, timestamp, previous content
- **Odometer tracking**: Travel is logged per shift for billing and compliance verification

### Security Features
- Passwords hashed with bcryptjs
- JWT tokens expire after 8 hours
- Role-based middleware blocks unauthorized access
- File uploads restricted to images only (JPEG, PNG, GIF, WebP) with MIME-type validation
- `.env` files excluded from version control

---

## 14. Scalability Considerations

This system is well-suited for:
- Single care provider organizations
- Multi-staff, multi-client NDIS operations
- Compliance-heavy environments

For larger enterprise deployments, consider:
- Horizontal scaling with load balancers
- Redis for session/cache management
- Dedicated file storage (AWS S3 / Azure Blob)
- PostgreSQL for relational compliance reporting

---

## Contributors

- [@Rajeshwar-Gola](https://github.com/Rajeshwar-Gola)

---

## License

This project is intended for authorized NDIS service provider use only.
