from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import engine, Base, create_all_tables
from .routers import (
    auth_router,
    projects_router,
    cast_router,
    crew_router,
    scripts_router,
    scenes_router,
    schedule_router,
    call_sheets_router,
    attendance_router,
    production_router,
    post_production_router,
    equipment_router,
    media_router,
    vfx_router,
    rentals_router,
    expenses_router,
    locations_router,
    hotels_router,
    travel_router,
    art_router,
    vehicles_router,
    budgets_router,
    purchase_orders_router,
    vendors_router,
    insurance_router,
    distribution_router,
    reports_router,
    settings_router,
    organizations_router,
    users_router,
)
from .routers import (
    business_router,
    teams_router,
    post_production_ext_router,
    distribution_ext_router,
    receivables_router,
)
from .models import *  # noqa: F401,F403 — ensure all models registered

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DATABASE_URL.startswith("sqlite"):
        await create_all_tables()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Flowbender — Open-Source Movie Production & Distribution ERP API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth & Core
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(organizations_router.router, prefix="/api/v1/organizations", tags=["Organizations"])
app.include_router(users_router.router, prefix="/api/v1/users", tags=["Users"])

# Projects
app.include_router(projects_router.router, prefix="/api/v1/projects", tags=["Projects"])

# Talent
app.include_router(cast_router.router, prefix="/api/v1/cast", tags=["Cast & Talent"])
app.include_router(crew_router.router, prefix="/api/v1/crew", tags=["Crew"])

# Scripts & Scenes
app.include_router(scripts_router.router, prefix="/api/v1/scripts", tags=["Scripts"])
app.include_router(scenes_router.router, prefix="/api/v1/scenes", tags=["Scenes"])

# Schedule & Production
app.include_router(schedule_router.router, prefix="/api/v1/schedule", tags=["Schedule"])
app.include_router(call_sheets_router.router, prefix="/api/v1/call-sheets", tags=["Call Sheets"])
app.include_router(attendance_router.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(production_router.router, prefix="/api/v1/production", tags=["Production"])

# Post-Production & Assets
app.include_router(post_production_router.router, prefix="/api/v1/post-production", tags=["Post-Production"])
app.include_router(equipment_router.router, prefix="/api/v1/equipment", tags=["Equipment"])
app.include_router(media_router.router, prefix="/api/v1/media", tags=["Media"])
app.include_router(vfx_router.router, prefix="/api/v1/vfx", tags=["VFX"])

# Crew Departments
app.include_router(rentals_router.router, prefix="/api/v1/rentals", tags=["Rentals"])
app.include_router(expenses_router.router, prefix="/api/v1/expenses", tags=["Expenses"])
app.include_router(locations_router.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(hotels_router.router, prefix="/api/v1/hotels", tags=["Hotels"])
app.include_router(travel_router.router, prefix="/api/v1/travel", tags=["Travel"])
app.include_router(art_router.router, prefix="/api/v1/art", tags=["Art & Props"])
app.include_router(vehicles_router.router, prefix="/api/v1/vehicles", tags=["Vehicles & Stunts"])

# Finance
app.include_router(budgets_router.router, prefix="/api/v1/budgets", tags=["Budgets"])
app.include_router(purchase_orders_router.router, prefix="/api/v1/purchase-orders", tags=["Purchase Orders"])
app.include_router(vendors_router.router, prefix="/api/v1/vendors", tags=["Vendors"])
app.include_router(insurance_router.router, prefix="/api/v1/insurance", tags=["Insurance"])

# Distribution
app.include_router(distribution_router.router, prefix="/api/v1/distribution", tags=["Distribution"])

# Reports & Settings
app.include_router(reports_router.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])

# F1-F4 New Routers
app.include_router(business_router.router, prefix="/api/v1/business", tags=["Business"])
app.include_router(teams_router.router, prefix="/api/v1/teams", tags=["Teams"])
app.include_router(post_production_ext_router.router, prefix="/api/v1/post-production-ext", tags=["Post-Production Extended"])
app.include_router(distribution_ext_router.router, prefix="/api/v1/distribution-ext", tags=["Distribution Extended"])
app.include_router(receivables_router.router, prefix="/api/v1/receivables", tags=["Receivables"])


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
