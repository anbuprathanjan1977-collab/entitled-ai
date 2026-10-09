import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import engine, Base, SessionLocal
from app.seed.seed_data import seed_database
from app.services.policy_checker import check_all_sources
from app.routers import schemes, match, applications, explain, ocr, admin, assistant, exams

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("urimai_api")

# Create tables
Base.metadata.create_all(bind=engine)

# Scheduled crawler
scheduler = AsyncIOScheduler()

async def scheduled_crawler_job():
    logger.info("Executing scheduled daily policy change scan...")
    db = SessionLocal()
    try:
        await check_all_sources(db)
    except Exception as e:
        logger.error(f"Scheduled crawler job encountered error: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Seed database with initial placeholder schemes and admin
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("UrimaiAI database verified & seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

    # 2. Start scheduled policy crawler
    try:
        scheduler.add_job(scheduled_crawler_job, "cron", hour=2, minute=0)
        scheduler.start()
        logger.info("APScheduler initialized for daily policy verification (02:00 AM).")
    except Exception as e:
        logger.warning(f"Failed to start APScheduler: {e}")

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down.")

app = FastAPI(
    title="Entitle AI API",
    description="Multi-language welfare scheme, exam deadlines and scholarship eligibility engine for India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup for Vite frontend (localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(schemes.router)
app.include_router(match.router)
app.include_router(applications.router)
app.include_router(explain.router)
app.include_router(assistant.router)
app.include_router(ocr.router)
app.include_router(admin.router)
app.include_router(exams.router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "UrimaiAI API",
        "region": "Tamil Nadu, India",
        "docs": "/docs",
        "version": "1.0.0"
    }
