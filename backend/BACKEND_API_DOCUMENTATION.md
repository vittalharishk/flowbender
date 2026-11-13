# Flowbender Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api/v1`  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI) | `http://localhost:8000/redoc` (ReDoc)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [API Routes — Complete Reference](#api-routes)
   - [Auth](#1-authentication)
   - [Organizations](#2-organizations)
   - [Users](#3-users)
   - [Projects](#4-projects)
   - [Cast & Talent](#5-cast--talent)
   - [Crew](#6-crew)
   - [Scripts](#7-scripts)
   - [Scenes](#8-scenes)
   - [Schedule](#9-schedule)
   - [Call Sheets](#10-call-sheets)
   - [Attendance](#11-attendance)
   - [Production](#12-production)
   - [Post-Production](#13-post-production)
   - [Equipment](#14-equipment)
   - [Media](#15-media)
   - [VFX](#16-vfx)
   - [Rentals](#17-rentals)
   - [Expenses](#18-expenses)
   - [Locations](#19-locations)
   - [Hotels](#20-hotels)
   - [Travel](#21-travel)
   - [Art & Props](#22-art--props)
   - [Vehicles & Stunts](#23-vehicles--stunts)
   - [Budgets](#24-budgets)
   - [Purchase Orders](#25-purchase-orders)
   - [Vendors](#26-vendors)
   - [Insurance](#27-insurance)
   - [Distribution](#28-distribution)
   - [Reports](#29-reports)
   - [Settings](#30-settings)
5. [Database Schema](#database-schema)
6. [Setup & Deployment](#setup--deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FastAPI Application                │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │   Auth   │  │ Middleware│  │   30 API Routers  │ │
│  │  (JWT)   │  │(CORS,Rate│  │  (158 endpoints)  │ │
│  │          │  │ Limit)   │  │                   │ │
│  └────┬─────┘  └──────────┘  └────────┬──────────┘ │
│       │                               │             │
│  ┌────┴───────────────────────────────┴──────────┐  │
│  │            Generic CRUD Service               │  │
│  │     (CRUDBase with org_id filtering)          │  │
│  └────────────────────┬──────────────────────────┘  │
│                       │                             │
│  ┌────────────────────┴──────────────────────────┐  │
│  │         SQLAlchemy 2.0 Async Models           │  │
│  │     (14 files, 70+ tables, multi-tenant)      │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────┴────┐    ┌─────┴────┐   ┌──────┴─────┐
   │PostgreSQL│    │  Redis   │   │   MinIO    │
   │  (Data)  │    │ (Cache)  │   │  (Files)   │
   └──────────┘    └──────────┘   └────────────┘
```

**Stack:** Python 3.10+ | FastAPI 0.115 | SQLAlchemy 2.0 (async) | PostgreSQL 15 | Redis 7 | MinIO  
**Multi-tenant:** Every table has `organization_id` — data is isolated per organization  
**Total:** 30 routers, 158 endpoints, 70+ database tables, 150+ Pydantic schemas

---

## Authentication

All endpoints (except register, login, refresh, health) require a JWT Bearer token.

### Register a new organization + admin user
```
POST /api/v1/auth/register
Body: { "org_name": "My Studio", "email": "admin@example.com", "password": "SecurePass1", "first_name": "Admin" }
Response: { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```

### Login
```
POST /api/v1/auth/login
Body: { "email": "admin@example.com", "password": "SecurePass1" }
Response: { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```

### Refresh token
```
POST /api/v1/auth/refresh
Body: { "refresh_token": "..." }
Response: { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```

### Use token
```
Authorization: Bearer <access_token>
```

### Roles & Permissions

| Role       | Level | Can Do                                       |
|------------|-------|----------------------------------------------|
| owner      | 1     | Everything + org management + delete org      |
| admin      | 2     | Everything + user management                  |
| manager    | 3     | Project management, crew/cast, schedules     |
| accountant | 4     | Financial operations, budgets, reports        |
| staff      | 5     | Create/edit project data                      |
| viewer     | 6     | Read-only access to all data                  |

---

## Common Patterns

### Standard CRUD Endpoints
Every resource follows this pattern:

| Method   | Path              | Auth     | Description          |
|----------|-------------------|----------|----------------------|
| `GET`    | `/`               | viewer+  | List (paginated)     |
| `GET`    | `/{id}`           | viewer+  | Get by ID            |
| `POST`   | `/`               | staff+   | Create               |
| `PATCH`  | `/{id}`           | staff+   | Partial update       |
| `DELETE` | `/{id}`           | staff+   | Delete               |

### Query Parameters (all list endpoints)
| Param        | Type   | Default | Description                    |
|-------------|--------|---------|--------------------------------|
| `skip`      | int    | 0       | Offset for pagination          |
| `limit`     | int    | 50      | Max items (1-200)              |
| `project_id`| UUID   | null    | Filter by project              |

### Response Format
```json
// Single item
{ "id": "uuid", "organization_id": "uuid", ...fields, "created_at": "datetime", "updated_at": "datetime" }

// List
[ { ...item }, { ...item }, ... ]

// Error
{ "detail": "Error message" }
```

---

## API Routes

### 1. Authentication
| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| POST   | `/auth/register`          | Register new org + admin user        |
| POST   | `/auth/login`             | Login, get JWT tokens                |
| POST   | `/auth/refresh`           | Refresh access token                 |
| POST   | `/auth/logout`            | Invalidate session                   |
| GET    | `/auth/me`                | Get current user info                |

### 2. Organizations
| Method | Endpoint                      | Auth    | Description               |
|--------|-------------------------------|---------|---------------------------|
| GET    | `/organizations/`             | viewer+ | List organizations         |
| GET    | `/organizations/{id}`         | viewer+ | Get organization           |
| POST   | `/organizations/`             | admin+  | Create organization        |
| PATCH  | `/organizations/{id}`         | admin+  | Update organization        |
| DELETE | `/organizations/{id}`         | admin+  | Delete organization        |

### 3. Users
| Method | Endpoint              | Auth    | Description                |
|--------|-----------------------|---------|----------------------------|
| GET    | `/users/`             | viewer+ | List users in org          |
| GET    | `/users/{id}`         | viewer+ | Get user                   |
| POST   | `/users/`             | admin+  | Create user (hashes password) |
| PATCH  | `/users/{id}`         | admin+  | Update user                |
| DELETE | `/users/{id}`         | admin+  | Delete user                |

### 4. Projects
| Method | Endpoint              | Auth    | Description           |
|--------|-----------------------|---------|-----------------------|
| GET    | `/projects/`          | viewer+ | List projects         |
| GET    | `/projects/{id}`      | viewer+ | Get project           |
| POST   | `/projects/`          | staff+  | Create project        |
| PATCH  | `/projects/{id}`      | staff+  | Update project        |
| DELETE | `/projects/{id}`      | staff+  | Delete project        |

**Fields:** title, type (feature-film/short-film/web-series/documentary/ad-film), status (development/pre-production/production/post-production/completed/on-hold), genre, language, director, producer, production_house, start_date, end_date, budget, logline, description

### 5. Cast & Talent
| Method | Endpoint                            | Auth    | Description                |
|--------|-------------------------------------|---------|----------------------------|
| GET    | `/cast/`                            | viewer+ | List cast members          |
| GET    | `/cast/{id}`                        | viewer+ | Get cast member            |
| POST   | `/cast/`                            | staff+  | Create cast member         |
| PATCH  | `/cast/{id}`                        | staff+  | Update cast member         |
| DELETE | `/cast/{id}`                        | staff+  | Delete cast member         |
| GET    | `/cast/contracts/`                  | viewer+ | List cast contracts        |
| GET    | `/cast/contracts/{id}`              | viewer+ | Get contract               |
| POST   | `/cast/contracts/`                  | staff+  | Create contract            |
| DELETE | `/cast/contracts/{id}`              | staff+  | Delete contract            |
| GET    | `/cast/candidates/`                 | viewer+ | List casting candidates    |
| GET    | `/cast/candidates/{id}`             | viewer+ | Get candidate              |
| POST   | `/cast/candidates/`                 | staff+  | Create candidate           |
| PATCH  | `/cast/candidates/{id}`             | staff+  | Update candidate           |
| GET    | `/cast/character-profiles/`         | viewer+ | List character profiles    |
| GET    | `/cast/character-profiles/{id}`     | viewer+ | Get character profile      |
| POST   | `/cast/character-profiles/`         | staff+  | Create character profile   |

**Cast Fields:** name, character, character_description, category (lead/supporting/junior/cameo), email, phone, agency, languages[], contract_status, total_fee, notes

### 6. Crew
| Method | Endpoint                        | Auth    | Description                |
|--------|---------------------------------|---------|----------------------------|
| GET    | `/crew/`                        | viewer+ | List crew members          |
| GET    | `/crew/{id}`                    | viewer+ | Get crew member            |
| POST   | `/crew/`                        | staff+  | Create crew member         |
| PATCH  | `/crew/{id}`                    | staff+  | Update crew member         |
| DELETE | `/crew/{id}`                    | staff+  | Delete crew member         |
| GET    | `/crew/assignments/`            | viewer+ | List assignments           |
| GET    | `/crew/assignments/{id}`        | viewer+ | Get assignment             |
| POST   | `/crew/assignments/`            | staff+  | Create assignment          |
| DELETE | `/crew/assignments/{id}`        | staff+  | Delete assignment          |
| GET    | `/crew/remuneration/`           | viewer+ | List remuneration deals    |
| GET    | `/crew/remuneration/{id}`       | viewer+ | Get remuneration deal      |
| POST   | `/crew/remuneration/`           | staff+  | Create remuneration deal   |
| DELETE | `/crew/remuneration/{id}`       | staff+  | Delete remuneration deal   |
| GET    | `/crew/payments/`               | viewer+ | List crew payments         |
| GET    | `/crew/payments/{id}`           | viewer+ | Get payment                |
| POST   | `/crew/payments/`               | staff+  | Record crew payment        |
| DELETE | `/crew/payments/{id}`           | staff+  | Delete payment             |

**Crew Fields:** name, department (direction/camera/art/costume/makeup/sound/lighting/production/post-production/vfx/music/stunts/choreography/catering/transport/accounts), role, email, phone, contract_status, day_rate, total_days, notes

### 7. Scripts
| Method | Endpoint                    | Auth    | Description            |
|--------|-----------------------------|---------|------------------------|
| GET    | `/scripts/`                 | viewer+ | List scripts           |
| GET    | `/scripts/{id}`             | viewer+ | Get script             |
| POST   | `/scripts/`                 | staff+  | Create script          |
| PATCH  | `/scripts/{id}`             | staff+  | Update script          |
| DELETE | `/scripts/{id}`             | staff+  | Delete script          |
| GET    | `/scripts/versions/`        | viewer+ | List script versions   |
| GET    | `/scripts/versions/{id}`    | viewer+ | Get version            |
| POST   | `/scripts/versions/`        | staff+  | Create version         |
| DELETE | `/scripts/versions/{id}`    | staff+  | Delete version         |

### 8. Scenes
| Method | Endpoint              | Auth    | Description        |
|--------|-----------------------|---------|--------------------|
| GET    | `/scenes/`            | viewer+ | List scenes        |
| GET    | `/scenes/{id}`        | viewer+ | Get scene          |
| POST   | `/scenes/`            | staff+  | Create scene       |
| PATCH  | `/scenes/{id}`        | staff+  | Update scene       |
| DELETE | `/scenes/{id}`        | staff+  | Delete scene       |

**Scene Fields:** scene_number, title, description, location, time_of_day, int_ext (interior/exterior/both), status, page_count, characters[], props[], notes

### 9. Schedule
| Method | Endpoint                          | Auth    | Description            |
|--------|-----------------------------------|---------|------------------------|
| GET    | `/schedule/`                      | viewer+ | List schedule entries  |
| GET    | `/schedule/{id}`                  | viewer+ | Get schedule entry     |
| POST   | `/schedule/`                      | staff+  | Create schedule entry  |
| PATCH  | `/schedule/{id}`                  | staff+  | Update schedule entry  |
| DELETE | `/schedule/{id}`                  | staff+  | Delete schedule entry  |
| GET    | `/schedule/shoot-days/`           | viewer+ | List shoot days        |
| GET    | `/schedule/shoot-days/{id}`       | viewer+ | Get shoot day          |
| POST   | `/schedule/shoot-days/`           | staff+  | Create shoot day       |
| PATCH  | `/schedule/shoot-days/{id}`       | staff+  | Update shoot day       |
| DELETE | `/schedule/shoot-days/{id}`       | staff+  | Delete shoot day       |

### 10. Call Sheets
| Method | Endpoint                  | Auth    | Description          |
|--------|---------------------------|---------|----------------------|
| GET    | `/call-sheets/`           | viewer+ | List call sheets     |
| GET    | `/call-sheets/{id}`       | viewer+ | Get call sheet       |
| POST   | `/call-sheets/`           | staff+  | Create call sheet    |
| PATCH  | `/call-sheets/{id}`       | staff+  | Update call sheet    |
| DELETE | `/call-sheets/{id}`       | staff+  | Delete call sheet    |

### 11. Attendance
| Method | Endpoint                  | Auth    | Description               |
|--------|---------------------------|---------|---------------------------|
| GET    | `/attendance/`            | viewer+ | List attendance records   |
| GET    | `/attendance/{id}`        | viewer+ | Get attendance record     |
| POST   | `/attendance/`            | staff+  | Record attendance         |
| PATCH  | `/attendance/{id}`        | staff+  | Update attendance         |
| DELETE | `/attendance/{id}`        | staff+  | Delete attendance record  |

### 12. Production
| Method | Endpoint                          | Auth    | Description                |
|--------|-----------------------------------|---------|----------------------------|
| GET    | `/production/`                    | viewer+ | List production tasks      |
| GET    | `/production/{id}`                | viewer+ | Get task                   |
| POST   | `/production/`                    | staff+  | Create task                |
| PATCH  | `/production/{id}`                | staff+  | Update task                |
| DELETE | `/production/{id}`                | staff+  | Delete task                |
| GET    | `/production/checklist/`          | viewer+ | List pre-prod checklist    |
| GET    | `/production/checklist/{id}`      | viewer+ | Get checklist item         |
| POST   | `/production/checklist/`          | staff+  | Create checklist item      |
| DELETE | `/production/checklist/{id}`      | staff+  | Delete checklist item      |
| GET    | `/production/dpr/`                | viewer+ | List DPR reports           |
| GET    | `/production/dpr/{id}`            | viewer+ | Get DPR                    |
| POST   | `/production/dpr/`                | staff+  | Create DPR                 |
| PATCH  | `/production/dpr/{id}`            | staff+  | Update DPR                 |
| DELETE | `/production/dpr/{id}`            | staff+  | Delete DPR                 |
| GET    | `/production/calendar/`           | viewer+ | List calendar events       |
| GET    | `/production/calendar/{id}`       | viewer+ | Get event                  |
| POST   | `/production/calendar/`           | staff+  | Create event               |
| PATCH  | `/production/calendar/{id}`       | staff+  | Update event               |
| DELETE | `/production/calendar/{id}`       | staff+  | Delete event               |

### 13. Post-Production
| Method | Endpoint                                  | Auth    | Description                |
|--------|-------------------------------------------|---------|----------------------------|
| GET    | `/post-production/`                       | viewer+ | List post-prod items       |
| GET    | `/post-production/{id}`                   | viewer+ | Get item                   |
| POST   | `/post-production/`                       | staff+  | Create item                |
| PATCH  | `/post-production/{id}`                   | staff+  | Update item                |
| DELETE | `/post-production/{id}`                   | staff+  | Delete item                |
| GET    | `/post-production/milestones/`            | viewer+ | List milestones            |
| GET    | `/post-production/milestones/{id}`        | viewer+ | Get milestone              |
| POST   | `/post-production/milestones/`            | staff+  | Create milestone           |
| DELETE | `/post-production/milestones/{id}`        | staff+  | Delete milestone           |
| GET    | `/post-production/deliverables/`          | viewer+ | List deliverables          |
| GET    | `/post-production/deliverables/{id}`      | viewer+ | Get deliverable            |
| POST   | `/post-production/deliverables/`          | staff+  | Create deliverable         |
| PATCH  | `/post-production/deliverables/{id}`      | staff+  | Update deliverable         |
| DELETE | `/post-production/deliverables/{id}`      | staff+  | Delete deliverable         |
| GET    | `/post-production/subtitles/`             | viewer+ | List subtitle languages    |
| GET    | `/post-production/subtitles/{id}`         | viewer+ | Get subtitle language      |
| POST   | `/post-production/subtitles/`             | staff+  | Create subtitle language   |
| PATCH  | `/post-production/subtitles/{id}`         | staff+  | Update subtitle language   |
| DELETE | `/post-production/subtitles/{id}`         | staff+  | Delete subtitle language   |

### 14. Equipment
| Method | Endpoint                              | Auth    | Description                |
|--------|---------------------------------------|---------|----------------------------|
| GET    | `/equipment/`                         | viewer+ | List equipment             |
| GET    | `/equipment/{id}`                     | viewer+ | Get equipment item         |
| POST   | `/equipment/`                         | staff+  | Create equipment item      |
| PATCH  | `/equipment/{id}`                     | staff+  | Update equipment item      |
| DELETE | `/equipment/{id}`                     | staff+  | Delete equipment item      |
| GET    | `/equipment/allocations/`             | viewer+ | List allocations           |
| GET    | `/equipment/allocations/{id}`         | viewer+ | Get allocation             |
| POST   | `/equipment/allocations/`             | staff+  | Create allocation          |
| DELETE | `/equipment/allocations/{id}`         | staff+  | Delete allocation          |
| GET    | `/equipment/maintenance/`             | viewer+ | List maintenance records   |
| GET    | `/equipment/maintenance/{id}`         | viewer+ | Get maintenance record     |
| POST   | `/equipment/maintenance/`             | staff+  | Create maintenance record  |
| DELETE | `/equipment/maintenance/{id}`         | staff+  | Delete maintenance record  |

### 15. Media
| Method | Endpoint                          | Auth    | Description                |
|--------|-----------------------------------|---------|----------------------------|
| GET    | `/media/`                         | viewer+ | List media assets          |
| GET    | `/media/{id}`                     | viewer+ | Get media asset            |
| POST   | `/media/`                         | staff+  | Create media asset         |
| PATCH  | `/media/{id}`                     | staff+  | Update media asset         |
| DELETE | `/media/{id}`                     | staff+  | Delete media asset         |
| GET    | `/media/camera-cards/`            | viewer+ | List camera cards          |
| GET    | `/media/camera-cards/{id}`        | viewer+ | Get camera card            |
| POST   | `/media/camera-cards/`            | staff+  | Create camera card         |
| DELETE | `/media/camera-cards/{id}`        | staff+  | Delete camera card         |
| GET    | `/media/storage/`                 | viewer+ | List storage devices       |
| GET    | `/media/storage/{id}`             | viewer+ | Get storage device         |
| POST   | `/media/storage/`                 | staff+  | Create storage device      |
| DELETE | `/media/storage/{id}`             | staff+  | Delete storage device      |
| GET    | `/media/footage/`                 | viewer+ | List footage metadata      |
| GET    | `/media/footage/{id}`             | viewer+ | Get footage metadata       |
| POST   | `/media/footage/`                 | staff+  | Create footage metadata    |
| DELETE | `/media/footage/{id}`             | staff+  | Delete footage metadata    |

### 16. VFX
| Method | Endpoint                      | Auth    | Description            |
|--------|-------------------------------|---------|------------------------|
| GET    | `/vfx/`                       | viewer+ | List VFX shots         |
| GET    | `/vfx/{id}`                   | viewer+ | Get VFX shot           |
| POST   | `/vfx/`                       | staff+  | Create VFX shot        |
| PATCH  | `/vfx/{id}`                   | staff+  | Update VFX shot        |
| DELETE | `/vfx/{id}`                   | staff+  | Delete VFX shot        |
| GET    | `/vfx/versions/`              | viewer+ | List VFX versions      |
| GET    | `/vfx/versions/{id}`          | viewer+ | Get version            |
| POST   | `/vfx/versions/`              | staff+  | Create version         |
| DELETE | `/vfx/versions/{id}`          | staff+  | Delete version         |
| GET    | `/vfx/reviews/`               | viewer+ | List reviews           |
| GET    | `/vfx/reviews/{id}`           | viewer+ | Get review             |
| POST   | `/vfx/reviews/`               | staff+  | Create review          |
| DELETE | `/vfx/reviews/{id}`           | staff+  | Delete review          |

### 17. Rentals
| Method | Endpoint                      | Auth    | Description                |
|--------|-------------------------------|---------|----------------------------|
| GET    | `/rentals/vendors/`           | viewer+ | List rental vendors        |
| GET    | `/rentals/vendors/{id}`       | viewer+ | Get vendor                 |
| POST   | `/rentals/vendors/`           | staff+  | Create vendor              |
| PATCH  | `/rentals/vendors/{id}`       | staff+  | Update vendor              |
| DELETE | `/rentals/vendors/{id}`       | staff+  | Delete vendor              |
| GET    | `/rentals/`                   | viewer+ | List rental records        |
| GET    | `/rentals/{id}`               | viewer+ | Get rental record          |
| POST   | `/rentals/`                   | staff+  | Create rental record       |
| PATCH  | `/rentals/{id}`               | staff+  | Update rental record       |
| DELETE | `/rentals/{id}`               | staff+  | Delete rental record       |
| GET    | `/rentals/payments/`          | viewer+ | List rental payments       |
| POST   | `/rentals/payments/`          | staff+  | Record rental payment      |

### 18. Expenses
| Method | Endpoint                              | Auth    | Description                  |
|--------|---------------------------------------|---------|------------------------------|
| GET    | `/expenses/`                          | viewer+ | List production expenses     |
| GET    | `/expenses/{id}`                      | viewer+ | Get expense                  |
| POST   | `/expenses/`                          | staff+  | Create expense               |
| PATCH  | `/expenses/{id}`                      | staff+  | Update expense               |
| DELETE | `/expenses/{id}`                      | staff+  | Delete expense               |
| GET    | `/expenses/payments/`                 | viewer+ | List expense payments        |
| POST   | `/expenses/payments/`                 | staff+  | Record expense payment       |
| GET    | `/expenses/office-rentals/`           | viewer+ | List office rentals          |
| GET    | `/expenses/office-rentals/{id}`       | viewer+ | Get office rental            |
| POST   | `/expenses/office-rentals/`           | staff+  | Create office rental         |
| PATCH  | `/expenses/office-rentals/{id}`       | staff+  | Update office rental         |
| DELETE | `/expenses/office-rentals/{id}`       | staff+  | Delete office rental         |
| GET    | `/expenses/office-payments/`          | viewer+ | List office rent payments    |
| POST   | `/expenses/office-payments/`          | staff+  | Record office rent payment   |
| GET    | `/expenses/maintenance/`              | viewer+ | List maintenance records     |
| GET    | `/expenses/maintenance/{id}`          | viewer+ | Get maintenance record       |
| POST   | `/expenses/maintenance/`              | staff+  | Create maintenance record    |
| DELETE | `/expenses/maintenance/{id}`          | staff+  | Delete maintenance record    |

### 19. Locations
| Method | Endpoint                          | Auth    | Description                  |
|--------|-----------------------------------|---------|------------------------------|
| GET    | `/locations/`                     | viewer+ | List film locations          |
| GET    | `/locations/{id}`                 | viewer+ | Get location                 |
| POST   | `/locations/`                     | staff+  | Create location              |
| PATCH  | `/locations/{id}`                 | staff+  | Update location              |
| DELETE | `/locations/{id}`                 | staff+  | Delete location              |
| GET    | `/locations/scouting/`            | viewer+ | List scouting records        |
| GET    | `/locations/scouting/{id}`        | viewer+ | Get scouting record          |
| POST   | `/locations/scouting/`            | staff+  | Create scouting record       |
| DELETE | `/locations/scouting/{id}`        | staff+  | Delete scouting record       |
| GET    | `/locations/agreements/`          | viewer+ | List location agreements     |
| GET    | `/locations/agreements/{id}`      | viewer+ | Get agreement                |
| POST   | `/locations/agreements/`          | staff+  | Create agreement             |
| PATCH  | `/locations/agreements/{id}`      | staff+  | Update agreement             |
| DELETE | `/locations/agreements/{id}`      | staff+  | Delete agreement             |
| GET    | `/locations/payments/`            | viewer+ | List location payments       |
| POST   | `/locations/payments/`            | staff+  | Record location payment      |

### 20. Hotels
| Method | Endpoint                      | Auth    | Description              |
|--------|-------------------------------|---------|--------------------------|
| GET    | `/hotels/`                    | viewer+ | List hotels              |
| GET    | `/hotels/{id}`                | viewer+ | Get hotel                |
| POST   | `/hotels/`                    | staff+  | Create hotel             |
| PATCH  | `/hotels/{id}`                | staff+  | Update hotel             |
| DELETE | `/hotels/{id}`                | staff+  | Delete hotel             |
| GET    | `/hotels/bookings/`           | viewer+ | List bookings            |
| GET    | `/hotels/bookings/{id}`       | viewer+ | Get booking              |
| POST   | `/hotels/bookings/`           | staff+  | Create booking           |
| PATCH  | `/hotels/bookings/{id}`       | staff+  | Update booking           |
| DELETE | `/hotels/bookings/{id}`       | staff+  | Delete booking           |
| GET    | `/hotels/payments/`           | viewer+ | List hotel payments      |
| POST   | `/hotels/payments/`           | staff+  | Record hotel payment     |

### 21. Travel
| Method | Endpoint                          | Auth    | Description              |
|--------|-----------------------------------|---------|--------------------------|
| GET    | `/travel/`                        | viewer+ | List trips               |
| GET    | `/travel/{trip_id}`               | viewer+ | Get trip                 |
| POST   | `/travel/`                        | staff+  | Create trip              |
| PATCH  | `/travel/{trip_id}`               | staff+  | Update trip              |
| DELETE | `/travel/{trip_id}`               | staff+  | Delete trip              |
| GET    | `/travel/{trip_id}/payments`      | viewer+ | List trip payments       |
| POST   | `/travel/{trip_id}/payments`      | staff+  | Record trip payment      |

### 22. Art & Props
| Method | Endpoint                                    | Auth    | Description                |
|--------|---------------------------------------------|---------|----------------------------|
| GET    | `/art/props`                                | viewer+ | List props                 |
| GET    | `/art/props/{prop_id}`                      | viewer+ | Get prop                   |
| POST   | `/art/props`                                | staff+  | Create prop                |
| PATCH  | `/art/props/{prop_id}`                      | staff+  | Update prop                |
| DELETE | `/art/props/{prop_id}`                      | staff+  | Delete prop                |
| GET    | `/art/props/{prop_id}/transactions`         | viewer+ | List prop transactions     |
| POST   | `/art/props/{prop_id}/transactions`         | staff+  | Create prop transaction    |
| GET    | `/art/sets`                                 | viewer+ | List production sets       |
| GET    | `/art/sets/{set_id}`                        | viewer+ | Get production set         |
| POST   | `/art/sets`                                 | staff+  | Create production set      |
| PATCH  | `/art/sets/{set_id}`                        | staff+  | Update production set      |
| DELETE | `/art/sets/{set_id}`                        | staff+  | Delete production set      |
| GET    | `/art/sets/{set_id}/tasks`                  | viewer+ | List set tasks             |
| POST   | `/art/sets/{set_id}/tasks`                  | staff+  | Create set task            |
| PATCH  | `/art/sets/{set_id}/tasks/{task_id}`        | staff+  | Update set task            |
| DELETE | `/art/sets/{set_id}/tasks/{task_id}`        | staff+  | Delete set task            |

### 23. Vehicles & Stunts
| Method | Endpoint                                              | Auth    | Description                  |
|--------|-------------------------------------------------------|---------|------------------------------|
| GET    | `/vehicles/vehicles/`                                 | viewer+ | List production vehicles     |
| GET    | `/vehicles/vehicles/{id}`                             | viewer+ | Get vehicle                  |
| POST   | `/vehicles/vehicles/`                                 | staff+  | Create vehicle               |
| PATCH  | `/vehicles/vehicles/{id}`                             | staff+  | Update vehicle               |
| DELETE | `/vehicles/vehicles/{id}`                             | staff+  | Delete vehicle               |
| GET    | `/vehicles/vehicles/{id}/allocations`                 | viewer+ | List vehicle allocations     |
| POST   | `/vehicles/vehicles/{id}/allocations`                 | staff+  | Create allocation            |
| GET    | `/vehicles/caravans/`                                 | viewer+ | List caravans                |
| GET    | `/vehicles/caravans/{id}`                             | viewer+ | Get caravan                  |
| POST   | `/vehicles/caravans/`                                 | staff+  | Create caravan               |
| PATCH  | `/vehicles/caravans/{id}`                             | staff+  | Update caravan               |
| DELETE | `/vehicles/caravans/{id}`                             | staff+  | Delete caravan               |
| GET    | `/vehicles/caravans/{id}/allocations`                 | viewer+ | List caravan allocations     |
| POST   | `/vehicles/caravans/{id}/allocations`                 | staff+  | Create caravan allocation    |
| GET    | `/vehicles/drivers/`                                  | viewer+ | List drivers                 |
| GET    | `/vehicles/drivers/{id}`                              | viewer+ | Get driver                   |
| POST   | `/vehicles/drivers/`                                  | staff+  | Create driver                |
| PATCH  | `/vehicles/drivers/{id}`                              | staff+  | Update driver                |
| DELETE | `/vehicles/drivers/{id}`                              | staff+  | Delete driver                |
| GET    | `/vehicles/drivers/{id}/assignments`                  | viewer+ | List driver assignments      |
| POST   | `/vehicles/drivers/{id}/assignments`                  | staff+  | Create assignment            |
| GET    | `/vehicles/stunts/`                                   | viewer+ | List stunt plans             |
| GET    | `/vehicles/stunts/{id}`                               | viewer+ | Get stunt plan               |
| POST   | `/vehicles/stunts/`                                   | staff+  | Create stunt plan            |
| PATCH  | `/vehicles/stunts/{id}`                               | staff+  | Update stunt plan            |
| DELETE | `/vehicles/stunts/{id}`                               | staff+  | Delete stunt plan            |
| GET    | `/vehicles/stunts/equipment/`                         | viewer+ | List stunt equipment         |
| GET    | `/vehicles/stunts/equipment/{id}`                     | viewer+ | Get stunt equipment          |
| POST   | `/vehicles/stunts/equipment/`                         | staff+  | Create stunt equipment       |
| PATCH  | `/vehicles/stunts/equipment/{id}`                     | staff+  | Update stunt equipment       |
| DELETE | `/vehicles/stunts/equipment/{id}`                     | staff+  | Delete stunt equipment       |

### 24. Budgets
| Method | Endpoint                                      | Auth    | Description                  |
|--------|-----------------------------------------------|---------|------------------------------|
| GET    | `/budgets/`                                   | viewer+ | List project budgets         |
| GET    | `/budgets/{id}`                               | viewer+ | Get budget                   |
| POST   | `/budgets/`                                   | staff+  | Create budget                |
| PATCH  | `/budgets/{id}`                               | staff+  | Update budget                |
| DELETE | `/budgets/{id}`                               | staff+  | Delete budget                |
| GET    | `/budgets/{id}/departments`                   | viewer+ | List department budgets      |
| GET    | `/budgets/{id}/departments/{dept_id}`         | viewer+ | Get department budget        |
| POST   | `/budgets/{id}/departments`                   | staff+  | Create department budget     |
| PATCH  | `/budgets/{id}/departments/{dept_id}`         | staff+  | Update department budget     |
| GET    | `/budgets/{id}/revisions`                     | viewer+ | List budget revisions        |
| POST   | `/budgets/{id}/revisions`                     | staff+  | Create budget revision       |
| GET    | `/budgets/line-items/`                        | viewer+ | List budget line items       |
| GET    | `/budgets/line-items/{id}`                    | viewer+ | Get line item                |
| POST   | `/budgets/line-items/`                        | staff+  | Create line item             |
| PATCH  | `/budgets/line-items/{id}`                    | staff+  | Update line item             |
| DELETE | `/budgets/line-items/{id}`                    | staff+  | Delete line item             |

### 25. Purchase Orders
| Method | Endpoint                      | Auth    | Description              |
|--------|-------------------------------|---------|--------------------------|
| GET    | `/purchase-orders/`           | viewer+ | List purchase orders     |
| GET    | `/purchase-orders/{id}`       | viewer+ | Get purchase order       |
| POST   | `/purchase-orders/`           | staff+  | Create purchase order    |
| PATCH  | `/purchase-orders/{id}`       | staff+  | Update purchase order    |
| DELETE | `/purchase-orders/{id}`       | staff+  | Delete purchase order    |

### 26. Vendors
| Method | Endpoint                  | Auth    | Description          |
|--------|---------------------------|---------|----------------------|
| GET    | `/vendors/`               | viewer+ | List vendors         |
| GET    | `/vendors/{id}`           | viewer+ | Get vendor           |
| POST   | `/vendors/`               | staff+  | Create vendor        |
| PATCH  | `/vendors/{id}`           | staff+  | Update vendor        |
| DELETE | `/vendors/{id}`           | staff+  | Delete vendor        |

### 27. Insurance
| Method | Endpoint                                  | Auth    | Description              |
|--------|-------------------------------------------|---------|--------------------------|
| GET    | `/insurance/`                             | viewer+ | List policies            |
| GET    | `/insurance/{policy_id}`                  | viewer+ | Get policy               |
| POST   | `/insurance/`                             | staff+  | Create policy            |
| PATCH  | `/insurance/{policy_id}`                  | staff+  | Update policy            |
| DELETE | `/insurance/{policy_id}`                  | staff+  | Delete policy            |
| GET    | `/insurance/{policy_id}/claims`           | viewer+ | List claims for policy   |
| GET    | `/insurance/{policy_id}/claims/{id}`      | viewer+ | Get claim                |
| POST   | `/insurance/{policy_id}/claims`           | staff+  | File claim               |
| PATCH  | `/insurance/{policy_id}/claims/{id}`      | staff+  | Update claim             |
| DELETE | `/insurance/{policy_id}/claims/{id}`      | staff+  | Delete claim             |

### 28. Distribution
| Method | Endpoint                                      | Auth    | Description                    |
|--------|-----------------------------------------------|---------|--------------------------------|
| GET    | `/distribution/rights-deals/`                 | viewer+ | List rights deals              |
| GET    | `/distribution/rights-deals/{id}`             | viewer+ | Get rights deal                |
| POST   | `/distribution/rights-deals/`                 | staff+  | Create rights deal             |
| PATCH  | `/distribution/rights-deals/{id}`             | staff+  | Update rights deal             |
| DELETE | `/distribution/rights-deals/{id}`             | staff+  | Delete rights deal             |
| GET    | `/distribution/agreements/`                   | viewer+ | List distribution agreements   |
| GET    | `/distribution/agreements/{id}`               | viewer+ | Get agreement                  |
| POST   | `/distribution/agreements/`                   | staff+  | Create agreement               |
| PATCH  | `/distribution/agreements/{id}`               | staff+  | Update agreement               |
| DELETE | `/distribution/agreements/{id}`               | staff+  | Delete agreement               |
| GET    | `/distribution/releases/`                     | viewer+ | List releases                  |
| GET    | `/distribution/releases/{id}`                 | viewer+ | Get release                    |
| POST   | `/distribution/releases/`                     | staff+  | Create release                 |
| PATCH  | `/distribution/releases/{id}`                 | staff+  | Update release                 |
| DELETE | `/distribution/releases/{id}`                 | staff+  | Delete release                 |
| GET    | `/distribution/revenue/`                      | viewer+ | List revenue entries           |
| GET    | `/distribution/revenue/{id}`                  | viewer+ | Get revenue entry              |
| POST   | `/distribution/revenue/`                      | staff+  | Record revenue                 |
| PATCH  | `/distribution/revenue/{id}`                  | staff+  | Update revenue entry           |
| DELETE | `/distribution/revenue/{id}`                  | staff+  | Delete revenue entry           |
| GET    | `/distribution/settlements/`                  | viewer+ | List settlements               |
| GET    | `/distribution/settlements/{id}`              | viewer+ | Get settlement                 |
| POST   | `/distribution/settlements/`                  | staff+  | Create settlement              |
| PATCH  | `/distribution/settlements/{id}`              | staff+  | Update settlement              |
| DELETE | `/distribution/settlements/{id}`              | staff+  | Delete settlement              |

### 29. Reports
| Method | Endpoint                              | Auth    | Description                                |
|--------|---------------------------------------|---------|--------------------------------------------|
| GET    | `/reports/financial-summary`          | viewer+ | Budget vs spent aggregation by project     |
| GET    | `/reports/production-status`          | viewer+ | Task/shoot day counts by status            |
| GET    | `/reports/distribution-summary`       | viewer+ | Revenue aggregation by territory/channel   |

**Query:** All accept optional `project_id` parameter.

### 30. Settings
| Method | Endpoint                              | Auth    | Description                  |
|--------|---------------------------------------|---------|------------------------------|
| GET    | `/settings/notifications`             | viewer+ | List user notifications      |
| PATCH  | `/settings/notifications/{id}`        | viewer+ | Mark notification read       |
| GET    | `/settings/preferences`               | viewer+ | List user preferences        |
| POST   | `/settings/preferences`               | viewer+ | Create/set preference        |
| PATCH  | `/settings/preferences/{id}`          | viewer+ | Update preference            |
| DELETE | `/settings/preferences/{id}`          | viewer+ | Delete preference            |

---

## Database Schema

### 70+ Tables organized by module:

**Core (5 tables):** organizations, branches, users, user_sessions, audit_logs

**Projects (1):** projects

**Cast (6):** cast_members, cast_contracts, cast_candidates, character_profiles, artist_availabilities, cast_decision_log_entries

**Crew (4):** crew_members, crew_assignments, remuneration_agreements, crew_payment_records

**Scripts (3):** scripts, script_versions, scenes

**Schedule (5):** schedule_entries, shoot_days, call_sheets, attendance_records, catering_adjustments

**Production (4):** production_tasks, pre_prod_checklist_items, dpr_reports, calendar_events

**Post-Production (4):** post_production_items, post_prod_milestones, deliverable_items, subtitle_languages

**Assets (11):** equipment_items, equipment_allocations, equipment_maintenance, camera_cards, storage_devices, footage_metadata, media_assets, media_versions, vfx_shots, vfx_versions, vfx_reviews

**Crew Departments (31):** rental_vendors, rental_records, rental_payments, production_expenses, expense_payments, office_rentals, office_rent_payments, maintenance_records, film_locations, location_scouting, location_agreements, location_payments, hotels, hotel_bookings, hotel_payments, trips, travel_payments, prop_items, prop_transactions, production_sets, set_tasks, production_vehicles, vehicle_allocations, caravans, caravan_allocations, driver_profiles, driver_assignments, stunt_plans, stunt_safety_checklists, stunt_equipment, stunt_equipment_transactions

**Finance (10):** project_budgets, department_budgets, budget_revisions, budget_line_items, purchase_orders, vendors, insurance_policies, insurance_claims, expense_items, payroll_entries

**Distribution (5):** rights_deals, distribution_agreements, distribution_releases, distribution_revenue, distribution_settlements

**Settings (2):** notifications, user_preferences

---

## Setup & Deployment

### Local Development (no Docker)

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start PostgreSQL (install separately or use Docker for just DB)
# Make sure PostgreSQL is running on localhost:5432

# 5. Run migrations
alembic upgrade head

# 6. Seed demo data
python -m scripts.seed_data

# 7. Start API server
uvicorn app.main:app --reload --port 8000
```

### Docker Compose (all services)

```bash
cd backend
docker-compose up -d
```

### Environment Variables (.env)

| Variable          | Default                                              | Description            |
|-------------------|------------------------------------------------------|------------------------|
| DATABASE_URL      | postgresql+asyncpg://flowbender:flowbender@localhost:5432/flowbender | DB connection |
| REDIS_URL         | redis://localhost:6379/0                             | Redis connection       |
| SECRET_KEY        | change-this-in-production                            | JWT signing key        |
| MINIO_ENDPOINT    | localhost:9000                                       | MinIO endpoint         |
| MINIO_ACCESS_KEY  | minioadmin                                           | MinIO access key       |
| MINIO_SECRET_KEY  | minioadmin                                           | MinIO secret key       |
| MINIO_BUCKET      | flowbender                                           | MinIO bucket name      |
| DEBUG             | true                                                 | Debug mode             |

### Running Tests

```bash
pip install aiosqlite    # SQLite async driver for tests
pytest app/tests/ -v
```

### Demo Credentials (after seed)
- **Email:** admin@flowbender.com
- **Password:** Admin@123
- **Role:** owner
