from contextlib import asynccontextmanager
import mimetypes

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.validation import validation_error_message
from app.database import Base, engine
from app.routes import account, admin, announcements


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Comunidade Conectada API", version="1.0.0", lifespan=lifespan)
settings = get_settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
# Windows does not always register WebP in its MIME database.
mimetypes.add_type("image/webp", ".webp")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
app.include_router(account.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(announcements.router, prefix="/api")
app.include_router(announcements.admin_router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def request_validation_error(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": validation_error_message(exc.errors())},
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}
