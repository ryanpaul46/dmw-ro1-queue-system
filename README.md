# DMW RO1 — Queue Management System

A production-ready queue management system for the Department of Migrant Workers Regional Office I.

---

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm

---

## 1. Database Setup

```bash
# Connect to PostgreSQL and run the schema
psql -U postgres -f backend/db/schema.sql
```

This creates the `dmw_queue` database, all tables, and seeds:
- 6 services
- 10 counters
- 2 default users (`admin` / `staff1`, both with password: `password`)

> **Change default passwords immediately in production.**

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/dmw_queue
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
```

Edit `frontend/.env` if needed:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

---

## 4. Access the System

| Page | URL | Auth |
|------|-----|------|
| Kiosk (Client) | http://localhost:5173/ | None |
| Staff/Admin Login | http://localhost:5173/login | Required |
| Dashboard | http://localhost:5173/dashboard | JWT |
| TV Display | http://localhost:5173/tv | None |

---

## 5. Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | password | admin |
| staff1 | password | staff |

---

## Project Structure

```
dmw-ro1-queue-system/
├── backend/
│   ├── controllers/       # Business logic
│   ├── db/                # Pool + schema.sql
│   ├── middleware/        # JWT auth middleware
│   ├── routes/            # Express routers
│   ├── socket/            # Socket.IO setup
│   ├── .env
│   └── server.js
└── frontend/
    └── src/
        ├── components/    # ProtectedRoute, UserManagement
        ├── pages/         # Kiosk, Login, Dashboard, TVDisplay
        ├── services/      # Axios API instance
        └── socket/        # Socket.IO client
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | — | Login |
| GET | /api/services | — | List services |
| GET | /api/counters | JWT | List counters |
| PATCH | /api/counters/:id/status | Admin | Toggle counter |
| POST | /api/queue | — | Create queue (kiosk) |
| GET | /api/queue | JWT | List today's queues |
| POST | /api/queue/next/:counterId | JWT | Call next queue |
| GET | /api/admin/users | Admin | List users |
| POST | /api/admin/users | Admin | Create user |
| DELETE | /api/admin/users/:id | Admin | Delete user |

---

## Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `queueUpdated` | Server → All clients | — |
| `announce` | Server → All clients | `{ queue_number, service_name, counter_name }` |
