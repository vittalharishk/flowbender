# Flowbender Backend API

Python FastAPI backend for the Flowbender Movie Production & Distribution ERP.

## Stack

- **FastAPI** 0.115 with async support
- **SQLAlchemy** 2.0 (async with asyncpg)
- **PostgreSQL** 15 with UUID primary keys
- **Redis** 7 for caching and sessions
- **MinIO** for file/media storage
- **Alembic** for database migrations
- **JWT** authentication with role-based access control

## Quick Start

### With Docker Compose

```bash
cd backend
docker-compose up -d
```

Services: API (8000), PostgreSQL (5432), Redis (6379), MinIO (9000/9001)

### Local Development

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Database Setup

```bash
# Run migrations
alembic upgrade head

# Seed demo data
python -m scripts.seed_data
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"org_name": "My Studio", "email": "admin@example.com", "password": "SecurePass1", "first_name": "Admin"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "SecurePass1"}'
```

## Project Structure

```
backend/
  app/
    auth/           # JWT auth, password hashing, dependencies
    middleware/      # Rate limiting, tenant context
    models/         # SQLAlchemy models (14 files, 70+ tables)
    schemas/        # Pydantic v2 request/response schemas
    routers/        # FastAPI route handlers (30 routers)
    services/       # Generic CRUD service
    tests/          # pytest test suite
  alembic/          # Database migration scripts
  scripts/          # Seed data, utilities
  docker-compose.yml
  Dockerfile
  requirements.txt
```

## Roles

| Role       | Access Level |
|------------|-------------|
| owner      | Full access, org management |
| admin      | All operations within org |
| manager    | Project management, team operations |
| accountant | Financial operations, reports |
| staff      | Create/edit project data |
| viewer     | Read-only access |

## API Endpoints (30 Routers)

### Core
- `/api/v1/auth` — Register, login, refresh, logout
- `/api/v1/organizations` — Organization CRUD
- `/api/v1/users` — User management

### Production
- `/api/v1/projects` — Projects
- `/api/v1/cast` — Cast, contracts, candidates, character profiles
- `/api/v1/crew` — Crew, assignments, remuneration, payments
- `/api/v1/scripts` — Scripts, versions
- `/api/v1/scenes` — Scenes
- `/api/v1/schedule` — Schedule entries, shoot days
- `/api/v1/call-sheets` — Call sheets
- `/api/v1/attendance` — Attendance records
- `/api/v1/production` — Tasks, checklists, DPR, calendar

### Post-Production & Assets
- `/api/v1/post-production` — Post-production items, milestones, deliverables
- `/api/v1/equipment` — Equipment, allocations, maintenance
- `/api/v1/media` — Media assets, camera cards, storage, footage
- `/api/v1/vfx` — VFX shots, versions, reviews

### Crew Departments
- `/api/v1/rentals` — Rental vendors, records, payments
- `/api/v1/expenses` — Production expenses, office rentals, maintenance
- `/api/v1/locations` — Film locations, scouting, agreements
- `/api/v1/hotels` — Hotels, bookings, payments
- `/api/v1/travel` — Trips, travel payments
- `/api/v1/art` — Props, production sets
- `/api/v1/vehicles` — Vehicles, caravans, drivers, stunts

### Finance
- `/api/v1/budgets` — Budgets, department budgets, revisions
- `/api/v1/purchase-orders` — Purchase orders
- `/api/v1/vendors` — Vendors
- `/api/v1/insurance` — Policies, claims

### Distribution & Reports
- `/api/v1/distribution` — Rights deals, agreements, releases, revenue, settlements
- `/api/v1/reports` — Financial summary, production status, distribution summary
- `/api/v1/settings` — Notifications, user preferences

## Testing

```bash
pip install pytest pytest-asyncio httpx aiosqlite
pytest app/tests/ -v
```

## Environment Variables

See `.env` for all configuration options.
