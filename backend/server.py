import bcrypt
import logging
import asyncio

# ---------------------------------------------------------------------------
# Compatibility Patches (Applied first!)
# ---------------------------------------------------------------------------
# Fix for passlib/bcrypt incompatibility in newer versions (4.1+)
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})  # type: ignore

import asyncio
import re
import uuid
import os
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv 
from pydantic import BaseModel, Field, EmailStr, ConfigDict 
from passlib.context import CryptContext
from jose import JWTError, jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import requests

from database import db, client 


from starlette.responses import StreamingResponse
from events import event_bus
import json
import aiosmtplib
from email.message import EmailMessage
from jinja2 import Template

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set. Refusing to start.")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@kudosd.com")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
PASSWORD_MIN_LENGTH = 8

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Try passlib first
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.warning(f"Passlib verification failed, trying direct bcrypt: {e}")
        try:
            # Fallback to direct bcrypt
            if isinstance(hashed_password, str):
                hashed_password_bytes = hashed_password.encode("utf-8")
            else:
                hashed_password_bytes = hashed_password
                
            result = bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password_bytes)
            if result:
                logger.info("Direct bcrypt verification succeeded")
            return result
        except Exception as e2:
            logger.error(f"Direct bcrypt verification also failed: {e2}")
            return False


def get_password_hash(password: str) -> str:
    try:
        # Try passlib first
        return pwd_context.hash(password)
    except Exception as e:
        logger.warning(f"Passlib hashing failed, trying direct bcrypt: {e}")
        try:
            # Fallback to direct bcrypt (returns string for DB storage)
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
            return hashed.decode("utf-8")
        except Exception as e2:
            logger.error(f"Direct bcrypt hashing also failed: {e2}")
            raise e2


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def validate_password_strength(password: str) -> None:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {PASSWORD_MIN_LENGTH} characters long",
        )


def parse_datetime(value) -> datetime:
    """Convert an ISO-format string to a datetime, or return as-is."""
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    return value


async def send_reset_email(email: str, token: str):
    """Send a password reset email to the user. Returns success status."""
    # Use query-param format so the link works cleanly on any SPA router
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.error(f"❌ SMTP not configured! Password reset email NOT sent to {email}")
        logger.error(f"   Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env")
        logger.error(f"   Reset link that would be sent: {reset_link}")
        return False

    msg = EmailMessage()
    msg["Subject"] = "Reset Your KudosD Password"
    msg["From"] = SMTP_FROM
    msg["To"] = email
    
    content = f"""Hello,

You requested a password reset for your KudosD account. 
Please click the link below to set a new password:

{reset_link}

This link will expire in 15 minutes.

If you did not request this, please ignore this email.

Best,
The KudosD Team
"""
    msg.set_content(content)
    
    try:
        logger.info(f"Attempting to send password reset email to {email}...")
        # Port 465 → implicit TLS (use_tls=True)
        # Port 587 → STARTTLS (use_tls=False, start_tls=True)
        # Any other port → plain (use_tls=False, start_tls=False)
        _use_tls = SMTP_PORT == 465
        _start_tls = SMTP_PORT == 587
        await asyncio.wait_for(
                aiosmtplib.send(
                msg,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SMTP_USER,
                password=SMTP_PASS,
                use_tls=_use_tls,
                start_tls=_start_tls,
            ),
            timeout=10
        )
        logger.info(f"✅ Password reset email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send reset email to {email}")
        logger.error(f"   Error type: {type(e).__name__}")
        logger.error(f"   Error: {str(e)}")
        logger.error(f"   Reset link: {reset_link}")
        return False

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user  # type: ignore


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> Optional[dict]:
    """Like get_current_user but returns None instead of 401."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    user = await db.users.find_one({"email": email}, {"_id": 0})
    return user


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    username: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: str
    full_name: str
    username: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    created_at: datetime


class DeveloperResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: str
    username: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    created_at: datetime
    project_count: int = 0


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None


class ProjectCreate(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    category: str
    status: str = "in_progress"
    thumbnail_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: str  # Mandatory for contribution
    documentation_url: Optional[str] = None
    media_urls: List[str] = []


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    documentation_url: Optional[str] = None
    media_urls: Optional[List[str]] = None



class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")


    project_id: str
    user_email: str
    user_username: str
    user_full_name: str
    title: str
    description: str
    tech_stack: List[str]
    category: str
    status: str
    thumbnail_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    documentation_url: Optional[str] = None
    media_urls: List[str] = []
    created_at: datetime
    updated_at: datetime


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Project Discussion Models ---

class ProjectComment(BaseModel):
    content: str


class ProjectCommentResponse(BaseModel):
    comment_id: str
    project_id: str
    user_email: str
    user_username: str
    content: str
    created_at: datetime


# --- Blog Models ---

class BlogCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    content_markdown: str = ""
    cover_image_url: Optional[str] = None
    tags: List[str] = []
    category: str = "devlog"
    tech_stack: List[str] = []
    linked_project_id: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "draft"  # draft | published


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content_markdown: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    linked_project_id: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class BlogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    blog_id: str
    slug: str
    title: str
    subtitle: Optional[str] = None
    content_markdown: str
    cover_image_url: Optional[str] = None
    author_email: str
    author_username: str
    author_full_name: str
    tags: List[str] = []
    category: str
    tech_stack: List[str] = []
    linked_project_id: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str
    word_count: int = 0
    reading_time_minutes: int = 1
    view_count: int = 0
    comment_count: int = 0
    reaction_count: int = 0
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None


class CommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    comment_id: str
    blog_id: str
    parent_comment_id: Optional[str] = None
    author_email: str
    author_username: str
    author_full_name: str
    content: str
    upvotes: int = 0
    created_at: datetime


class ReactionCreate(BaseModel):
    type: str  # fire | rocket | bulb | clap | heart


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------


def generate_slug(title: str) -> str:
    """Generate a URL-friendly slug from a title with a short UUID suffix."""
    base = re.sub(r"[^\w\s-]", "", title.lower().strip())
    base = re.sub(r"[\s_]+", "-", base)
    base = re.sub(r"-+", "-", base).strip("-")
    suffix = str(uuid.uuid4())[:8]  # type: ignore
    return f"{base}-{suffix}" if base else suffix


def calculate_reading_time(text: str) -> int:
    """Estimate reading time in minutes (238 wpm average)."""
    words = len(text.split())
    return max(1, round(words / 238))



def _user_response(user: dict) -> UserResponse:
    """Build a UserResponse from a raw MongoDB document."""
    return UserResponse(email=user["email"], full_name=user["full_name"], username=user["username"], bio=user.get("bio"), avatar_url=user.get("avatar_url"), github_url=user.get("github_url"), linkedin_url=user.get("linkedin_url"), website_url=user.get("website_url"), location=user.get("location"), skills=user.get("skills", []), created_at=parse_datetime(user["created_at"]))  # type: ignore


async def _developer_response(user: dict) -> DeveloperResponse:
    """Build a DeveloperResponse from a raw MongoDB document including project count."""
    count = await db.projects.count_documents({"user_username": user["username"]})
    return DeveloperResponse(full_name=user["full_name"], username=user["username"], bio=user.get("bio"), avatar_url=user.get("avatar_url"), github_url=user.get("github_url"), linkedin_url=user.get("linkedin_url"), website_url=user.get("website_url"), location=user.get("location"), skills=user.get("skills", []), created_at=parse_datetime(user["created_at"]), project_count=count)  # type: ignore


def _project_response(project: dict) -> ProjectResponse:  # type: ignore
    """Build a ProjectResponse from a raw MongoDB document."""
    p = project.copy()
    
    # Ensure ID is a string
    if "_id" in p:
        del p["_id"]  # type: ignore
        
    # Handle dates safely
    p["created_at"] = parse_datetime(p.get("created_at", datetime.now(timezone.utc).isoformat()))
    p["updated_at"] = parse_datetime(p.get("updated_at", datetime.now(timezone.utc).isoformat()))
    
    # Ensure lists exist
    p["tech_stack"] = p.get("tech_stack", [])
    p["media_urls"] = p.get("media_urls", [])
    
    # Defaults for other required fields if missing
    p["description"] = p.get("description", "")
    p["category"] = p.get("category", "Uncategorized")
    p["status"] = p.get("status", "in_progress")
    
    return ProjectResponse(**p)


def _serialize(doc: dict) -> dict:
    """Sanitize a MongoDB doc for SSE broadcast."""
    doc = doc.copy()
    doc.pop("_id", None)
    doc.pop("password", None)
    # Convert datetime objects to ISO strings for JSON serialization
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — verify MongoDB connection
    try:
        await client.admin.command("ping")
        logger.info("Successfully connected to MongoDB")
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)

    # Startup — verify SMTP configuration
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.warning("⚠️  SMTP NOT CONFIGURED - Password reset emails WILL NOT be sent")
        logger.warning("   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env")
    else:
        logger.info(f"✅ SMTP configured: {SMTP_USER} @ {SMTP_HOST}:{SMTP_PORT}")

    # Create indexes for performance
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.projects.create_index("user_email")
        await db.projects.create_index("user_username")
        await db.projects.create_index([("created_at", -1)])
        await db.projects.create_index("project_id", unique=True)
        await db.blogs.create_index("slug", unique=True)
        await db.blogs.create_index("blog_id", unique=True)
        await db.blogs.create_index("author_email")
        await db.blogs.create_index([("published_at", -1)])
        await db.blogs.create_index("tags")
        await db.follows.create_index([("follower_email", 1), ("following_email", 1)], unique=True)
        await db.reactions.create_index([("blog_id", 1), ("user_email", 1), ("type", 1)], unique=True)
        await db.bookmarks.create_index([("user_email", 1), ("blog_id", 1)], unique=True)
        await db.comments.create_index([("blog_id", 1), ("created_at", 1)])
        logger.info("MongoDB indexes ensured")
    except Exception as e:
        logger.warning("Index creation warning (may already exist): %s", e)

    # Start Change Stream watchers as background tasks
    watcher_tasks = [
        asyncio.create_task(_watch_projects()),
        asyncio.create_task(_watch_blogs()),
        asyncio.create_task(_watch_comments()),
    ]
    logger.info("Change Stream watchers started for projects, blogs, comments")

    yield

    # Shutdown — cancel watchers and close DB
    for task in watcher_tasks:
        task.cancel()
    client.close()


# ---------------------------------------------------------------------------
# Change Stream Watchers
# ---------------------------------------------------------------------------

_CHANGE_PIPELINE = [{"$match": {"operationType": {"$in": ["insert", "update", "delete"]}}}]


async def _watch_projects():
    """Watch the projects collection and broadcast events."""
    try:
        async with db.projects.watch(_CHANGE_PIPELINE, full_document="updateLookup") as stream:
            async for change in stream:
                op = change["operationType"]
                doc = change.get("fullDocument")
                if op == "insert" and doc:
                    await event_bus.publish({"type": "project:new", "data": _serialize(doc)})
                elif op == "update" and doc:
                    await event_bus.publish({"type": "project:updated", "data": _serialize(doc)})
                elif op == "delete":
                    doc_key = str(change["documentKey"]["_id"])
                    await event_bus.publish({"type": "project:deleted", "data": {"id": doc_key}})
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Projects change stream error: {e}")


async def _watch_blogs():
    """Watch the blogs collection and broadcast events."""
    try:
        async with db.blogs.watch(_CHANGE_PIPELINE, full_document="updateLookup") as stream:
            async for change in stream:
                op = change["operationType"]
                doc = change.get("fullDocument")
                if op == "insert" and doc:
                    await event_bus.publish({"type": "blog:new", "data": _serialize(doc)})
                elif op == "update" and doc:
                    await event_bus.publish({"type": "blog:updated", "data": _serialize(doc)})
                elif op == "delete":
                    doc_key = str(change["documentKey"]["_id"])
                    await event_bus.publish({"type": "blog:deleted", "data": {"id": doc_key}})
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Blogs change stream error: {e}")


async def _watch_comments():
    """Watch the comments collection and broadcast events."""
    try:
        async with db.comments.watch(_CHANGE_PIPELINE, full_document="updateLookup") as stream:
            async for change in stream:
                op = change["operationType"]
                doc = change.get("fullDocument")
                if op == "insert" and doc:
                    await event_bus.publish({"type": "comment:new", "data": _serialize(doc)})
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Comments change stream error: {e}")


# ---------------------------------------------------------------------------
# App & middleware
# ---------------------------------------------------------------------------

app = FastAPI(lifespan=lifespan)

_frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
# Allow both the configured frontend URL and common local dev origins
_allowed_origins = list({
    _frontend_url,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
})
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Auth Routes
# ---------------------------------------------------------------------------


@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    validate_password_strength(user_data.password)

    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user_dict = {
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "full_name": user_data.full_name,
        "username": user_data.username,
        "bio": None,
        "avatar_url": None,
        "github_url": None,
        "linkedin_url": None,
        "website_url": None,
        "location": None,
        "skills": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user_dict)

    access_token = create_access_token(data={"sub": user_data.email})
    user_response = _user_response(user_dict)

    return Token(access_token=access_token, token_type="bearer", user=user_response)  # type: ignore


@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    try:
        logger.info(f"Login attempt for: {user_data.email}")
        user = await db.users.find_one({"email": user_data.email})
        
        if not user:
            logger.warning(f"User not found in DB: {user_data.email}")
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        # Verify password
        if not verify_password(user_data.password, user["password"]):
            logger.warning(f"Failed login attempt for: {user_data.email}")
            raise HTTPException(status_code=401, detail="Incorrect email or password")

        logger.info(f"Login successful for: {user_data.email}")
        access_token = create_access_token(data={"sub": user_data.email})
        return Token(access_token=access_token, token_type="bearer", user=_user_response(user))  # type: ignore
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal error during login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)


@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}

    if update_data:
        await db.users.update_one({"email": current_user["email"]}, {"$set": update_data})

    updated_user = await db.users.find_one({"email": current_user["email"]}, {"_id": 0})
    return _user_response(updated_user)


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    logger.info(f"Password reset requested for: {request.email}")

    # Fail fast if SMTP isn't configured — no point generating a token
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.error("SMTP not configured; cannot send password reset email.")
        raise HTTPException(
            status_code=503,
            detail="Password reset email service is not configured. Please contact support or try again later.",
        )

    user = await db.users.find_one({"email": request.email})
    if not user:
        # Return the same generic message so as not to reveal whether an account exists
        logger.warning(f"Password reset requested for non-existent email: {request.email}")
        return {"message": "If an account exists with this email, a reset link has been sent."}

    reset_token_id = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    token_data = {"sub": request.email, "type": "reset", "jti": reset_token_id, "exp": expire}
    reset_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    await db.users.update_one(
        {"email": request.email},
        {
            "$set": {
                "reset_token_id": reset_token_id,
                "reset_token_expires_at": expire.isoformat(),
            }
        },
    )
    asyncio.create_task(send_reset_email(request.email, reset_token))

    return {"message": "If an account exists with this email, a reset link has been sent."}


@api_router.get("/auth/validate-reset-token")
async def validate_reset_token(token: str):
    """Validate a password reset token without consuming it.
    The frontend calls this on page load to show a proper error if the token
    is missing, expired, or already used.
    """
    if not token:
        raise HTTPException(status_code=400, detail="Reset token is required")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        email = payload.get("sub")
        token_id = payload.get("jti")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if not email or not token_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    stored_token_id = user.get("reset_token_id")
    stored_expiry = user.get("reset_token_expires_at")
    if stored_token_id != token_id or not stored_expiry:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used")

    if parse_datetime(stored_expiry) < datetime.now(timezone.utc):
        # Clean up expired token
        await db.users.update_one(
            {"email": email},
            {"$unset": {"reset_token_id": "", "reset_token_expires_at": ""}},
        )
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    return {"valid": True, "email": email}


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPassword):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        email = payload.get("sub")
        token_id = payload.get("jti")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if not email or not token_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_token_id = user.get("reset_token_id")
    stored_expiry = user.get("reset_token_expires_at")
    if stored_token_id != token_id or not stored_expiry:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used")

    if parse_datetime(stored_expiry) < datetime.now(timezone.utc):
        await db.users.update_one(
            {"email": email},
            {"$unset": {"reset_token_id": "", "reset_token_expires_at": ""}},
        )
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    validate_password_strength(data.new_password)

    hashed_password = get_password_hash(data.new_password)
    await db.users.update_one(
        {"email": email},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_token_id": "", "reset_token_expires_at": ""},
        },
    )

    return {"message": "Password reset successfully"}


@api_router.post("/auth/google", response_model=Token)
async def google_auth(data: GoogleAuthRequest):
    """Authenticate via Google OAuth 2.0 ID token."""
    try:
        # Verify the Google ID token
        idinfo = google_id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        email = idinfo.get("email")
        full_name = idinfo.get("name", "")
        avatar_url = idinfo.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")

        # Check if user exists
        user = await db.users.find_one({"email": email}, {"_id": 0})

        if user:
            # Existing user → login
            logger.info(f"Google login for existing user: {email}")
            access_token = create_access_token(data={"sub": email})
            return Token(access_token=access_token, token_type="bearer", user=_user_response(user))  # type: ignore

        # New user → register
        logger.info(f"Google signup for new user: {email}")

        # Generate a unique username from the email prefix
        base_username = re.sub(r"[^a-zA-Z0-9]", "", email.split("@")[0]).lower()
        if not base_username:
            base_username = "user"
        username = base_username
        # If taken, append a random suffix
        while await db.users.find_one({"username": username}):
            username = f"{base_username}{str(uuid.uuid4())[:6]}"  # type: ignore

        user_dict = {
            "email": email,
            "password": None,  # No password for Google-auth users
            "full_name": full_name or username,
            "username": username,
            "bio": None,
            "avatar_url": avatar_url,
            "github_url": None,
            "linkedin_url": None,
            "website_url": None,
            "location": None,
            "skills": [],
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.users.insert_one(user_dict)

        access_token = create_access_token(data={"sub": email})
        return Token(access_token=access_token, token_type="bearer", user=_user_response(user_dict))  # type: ignore

    except ValueError as e:
        logger.error(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except HTTPException:
        raise


# ---------------------------------------------------------------------------
# User Routes
# ---------------------------------------------------------------------------


@api_router.get("/developers", response_model=List[DeveloperResponse])
async def get_developers(
    q: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    query = {}
    if q:
        query = {
            "$or": [
                {"full_name": {"$regex": q, "$options": "i"}},
                {"username": {"$regex": q, "$options": "i"}}
            ]
        }
    
    users_cursor = db.users.find(query, {"password": 0, "_id": 0}).skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    
    developers = []
    for u in users:
        dev = await _developer_response(u)
        developers.append(dev)
    
    return developers


@api_router.get("/users/{username}", response_model=UserResponse)
async def get_user_by_username(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user)


# ---------------------------------------------------------------------------
# Follow / Unfollow Routes
# ---------------------------------------------------------------------------


@api_router.post("/users/{username}/follow")
async def follow_user(username: str, current_user: dict = Depends(get_current_user)):
    """Follow a user by username."""
    if current_user["username"] == username:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate follows
    existing = await db.follows.find_one({
        "follower_email": current_user["email"],
        "following_email": target["email"],
    })
    if existing:
        return {"message": "Already following"}

    await db.follows.insert_one({
        "follower_email": current_user["email"],
        "follower_username": current_user["username"],
        "following_email": target["email"],
        "following_username": target["username"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": "Followed successfully"}


@api_router.delete("/users/{username}/follow")
async def unfollow_user(username: str, current_user: dict = Depends(get_current_user)):
    """Unfollow a user by username."""
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    await db.follows.delete_one({
        "follower_email": current_user["email"],
        "following_email": target["email"],
    })
    return {"message": "Unfollowed successfully"}


@api_router.get("/users/{username}/followers")
async def get_followers(username: str):
    """Get list of users who follow this user."""
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    follows = await db.follows.find(
        {"following_email": target["email"]}, {"_id": 0}
    ).to_list(500)

    follower_emails = [f["follower_email"] for f in follows]
    if not follower_emails:
        return []

    users = await db.users.find(
        {"email": {"$in": follower_emails}}, {"_id": 0, "password": 0}
    ).to_list(500)
    return users


@api_router.get("/users/{username}/following")
async def get_following(username: str):
    """Get list of users this user follows."""
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    follows = await db.follows.find(
        {"follower_email": target["email"]}, {"_id": 0}
    ).to_list(500)

    following_emails = [f["following_email"] for f in follows]
    if not following_emails:
        return []

    users = await db.users.find(
        {"email": {"$in": following_emails}}, {"_id": 0, "password": 0}
    ).to_list(500)
    return users


@api_router.get("/users/{username}/is-following")
async def check_is_following(username: str, current_user: dict = Depends(get_current_user)):
    """Check if current user follows this user."""
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.follows.find_one({
        "follower_email": current_user["email"],
        "following_email": target["email"],
    })
    return {"is_following": existing is not None}


# ---------------------------------------------------------------------------
# Project Routes
# ---------------------------------------------------------------------------


@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()

    project_dict = project_data.model_dump()
    project_dict["project_id"] = str(uuid.uuid4())
    project_dict["user_email"] = current_user["email"]
    project_dict["user_username"] = current_user["username"]
    project_dict["user_full_name"] = current_user["full_name"]
    project_dict["created_at"] = now
    project_dict["updated_at"] = now

    await db.projects.insert_one(project_dict)

    # Emit real-time event (faster than waiting for Change Stream)
    response = _project_response(project_dict)
    await event_bus.publish({
        "type": "project:new",
        "data": response.model_dump(mode="json"),
    })

    return response


@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_all_projects(
    category: Optional[str] = None, 
    status: Optional[str] = None,
    exclude_self: bool = False,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    query: dict[str, Any] = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    
    if exclude_self and current_user:
        query["user_email"] = {"$ne": current_user["email"]}
        query["github_url"] = {"$exists": True, "$nin": [None, ""]}

    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [_project_response(p) for p in projects]


@api_router.get("/projects/my", response_model=List[ProjectResponse])
async def get_my_projects(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Fetching projects for user: {current_user['email']}")
        projects = (
            await db.projects.find({"user_email": current_user["email"]}, {"_id": 0})
            .sort("created_at", -1)
            .to_list(100)
        )
        logger.info(f"Found {len(projects)} projects for {current_user['email']}")
        
        response_data = []
        for p in projects:  # type: ignore
            try:
                response_data.append(_project_response(p))
            except Exception as e:
                logger.error(f"Error building ProjectResponse for project {p.get('project_id')}: {e}")
                # We could continue or raise
        
        return response_data
    except Exception as e:
        logger.error(f"Unexpected error in get_my_projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/projects/user/{username}", response_model=List[ProjectResponse])
async def get_user_projects(username: str):
    projects = (
        await db.projects.find({"user_username": username}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return [_project_response(p) for p in projects]


@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_response(project)


@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project["user_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")

    update_data = {k: v for k, v in project_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.projects.update_one({"project_id": project_id}, {"$set": update_data})

    updated_project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    response = _project_response(updated_project)
    await event_bus.publish({
        "type": "project:updated",
        "data": response.model_dump(mode="json"),
    })
    return response


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"Attempting to delete project: {project_id} by user: {current_user['email']}")
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        logger.warning(f"Project not found: {project_id}")
        raise HTTPException(status_code=404, detail="Project not found")

    if project["user_email"] != current_user["email"]:
        logger.warning(f"Unauthorized deletion attempt for project {project_id} by {current_user['email']}")
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")

    result = await db.projects.delete_one({"project_id": project_id})
    logger.info(f"Project deletion result for {project_id}: {result.deleted_count} documents deleted")

    await event_bus.publish({
        "type": "project:deleted",
        "data": {"project_id": project_id},
    })

    return {"message": "Project deleted successfully"}


# --- Project Discussion Endpoints ---

@api_router.get("/projects/{project_id}/comments", response_model=List[ProjectCommentResponse])
async def get_project_comments(project_id: str):
    comments = (
        await db.project_comments.find({"project_id": project_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return comments


@api_router.post("/projects/{project_id}/comments", response_model=ProjectCommentResponse)
async def add_project_comment(
    project_id: str,
    comment: ProjectComment,
    current_user: dict = Depends(get_current_user),
):
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_comment = {
        "comment_id": str(uuid.uuid4()),
        "project_id": project_id,
        "user_email": current_user["email"],
        "user_username": current_user["username"],
        "content": comment.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.project_comments.insert_one(new_comment)
    
    # Return response
    response_data = new_comment.copy()
    response_data.pop("_id", None)

    # Publish for real-time
    await event_bus.publish({
        "type": "project:comment:added",
        "data": response_data,
    })

    return response_data


# ---------------------------------------------------------------------------
# Blog endpoints
# ---------------------------------------------------------------------------


def _blog_response(blog: dict) -> BlogResponse:
    """Build a BlogResponse from a raw MongoDB document."""
    b = blog.copy()
    if "_id" in b:
        del b["_id"]  # type: ignore
    b["created_at"] = parse_datetime(b.get("created_at", datetime.now(timezone.utc).isoformat()))
    b["updated_at"] = parse_datetime(b.get("updated_at", datetime.now(timezone.utc).isoformat()))
    if b.get("published_at"):
        b["published_at"] = parse_datetime(b["published_at"])
    b["tags"] = b.get("tags", [])
    b["tech_stack"] = b.get("tech_stack", [])
    b["content_markdown"] = b.get("content_markdown", "")
    b["category"] = b.get("category", "devlog")
    b["status"] = b.get("status", "draft")
    b["word_count"] = b.get("word_count", 0)
    b["reading_time_minutes"] = b.get("reading_time_minutes", 1)
    b["view_count"] = b.get("view_count", 0)
    b["comment_count"] = b.get("comment_count", 0)
    b["reaction_count"] = b.get("reaction_count", 0)
    return BlogResponse(**b)


@api_router.post("/blogs", response_model=BlogResponse)
async def create_blog(blog_data: BlogCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    word_count = len(blog_data.content_markdown.split())
    blog_dict = blog_data.model_dump()
    blog_dict["blog_id"] = str(uuid.uuid4())
    blog_dict["slug"] = generate_slug(blog_data.title)
    blog_dict["author_email"] = current_user["email"]
    blog_dict["author_username"] = current_user["username"]
    blog_dict["author_full_name"] = current_user["full_name"]
    blog_dict["word_count"] = word_count
    blog_dict["reading_time_minutes"] = calculate_reading_time(blog_data.content_markdown)
    blog_dict["view_count"] = 0
    blog_dict["comment_count"] = 0
    blog_dict["reaction_count"] = 0
    blog_dict["created_at"] = now
    blog_dict["updated_at"] = now
    if blog_data.status == "published":
        blog_dict["published_at"] = now
    else:
        blog_dict["published_at"] = None
    await db.blogs.insert_one(blog_dict)

    response = _blog_response(blog_dict)
    if blog_data.status == "published":
        await event_bus.publish({
            "type": "blog:new",
            "data": response.model_dump(mode="json"),
        })

    return response


@api_router.get("/blogs", response_model=List[BlogResponse])
async def get_all_blogs(
    tag: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
):
    query = {"status": "published"}
    if tag:
        query["tags"] = tag
    if category:
        query["category"] = category
    blogs = (
        await db.blogs.find(query, {"_id": 0})
        .sort("published_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    return [_blog_response(b) for b in blogs]


@api_router.get("/blogs/my", response_model=List[BlogResponse])
async def get_my_blogs(current_user: dict = Depends(get_current_user)):
    blogs = (
        await db.blogs.find({"author_email": current_user["email"]}, {"_id": 0})
        .sort("updated_at", -1)
        .to_list(100)
    )
    return [_blog_response(b) for b in blogs]


@api_router.get("/blogs/{slug}", response_model=BlogResponse)
async def get_blog_by_slug(
    slug: str,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    blog = await db.blogs.find_one({"slug": slug}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    # Only increment view_count if the viewer is NOT the author
    is_author = current_user and current_user.get("email") == blog.get("author_email")
    if not is_author:
        await db.blogs.update_one({"slug": slug}, {"$inc": {"view_count": 1}})
        blog["view_count"] = blog.get("view_count", 0) + 1

    return _blog_response(blog)


@api_router.put("/blogs/{blog_id}", response_model=BlogResponse)
async def update_blog(
    blog_id: str,
    blog_update: BlogUpdate,
    current_user: dict = Depends(get_current_user),
):
    blog = await db.blogs.find_one({"blog_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data: dict[str, Any] = {k: v for k, v in blog_update.model_dump().items() if v is not None}
    if "content_markdown" in update_data:
        update_data["word_count"] = len(update_data["content_markdown"].split())
        update_data["reading_time_minutes"] = calculate_reading_time(update_data["content_markdown"])
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.blogs.update_one({"blog_id": blog_id}, {"$set": update_data})
    updated = await db.blogs.find_one({"blog_id": blog_id}, {"_id": 0})
    response = _blog_response(updated)

    await event_bus.publish({
        "type": "blog:updated",
        "data": response.model_dump(mode="json"),
    })

    return response


@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"Attempting to delete blog: {blog_id} by user: {current_user['email']}")
    blog = await db.blogs.find_one({"blog_id": blog_id})
    if not blog:
        logger.warning(f"Blog not found: {blog_id}")
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        logger.warning(f"Unauthorized deletion attempt for blog {blog_id} by {current_user['email']}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.blogs.delete_one({"blog_id": blog_id})
    await db.comments.delete_many({"blog_id": blog_id})
    await db.reactions.delete_many({"blog_id": blog_id})
    logger.info(f"Blog {blog_id} and associated data deleted successfully")

    await event_bus.publish({
        "type": "blog:deleted",
        "data": {"blog_id": blog_id},
    })

    return {"message": "Blog deleted successfully"}


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

@api_router.post("/blogs/upload-image")
async def upload_blog_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload an image for a blog post (max 10 MB)."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if not file.content_type.startswith("image/") or ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file. Allowed image types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

    # Read in chunks, enforce 10 MB limit
    content = b""
    async for chunk in file:
        content += chunk
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename
    try:
        file_path.write_bytes(content)
        file_url = f"/uploads/{filename}"
        return {"url": file_url}
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


ALLOWED_DOC_EXTENSIONS = {".pdf", ".doc", ".docx"}

@api_router.post("/projects/upload-document")
async def upload_project_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a documentation file for a project (max 10 MB)."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_DOC_EXTENSIONS)}"
        )

    # Read in chunks, enforce 10 MB limit
    content = b""
    async for chunk in file:
        content += chunk
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    filename = f"doc_{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename
    try:
        file_path.write_bytes(content)
        file_url = f"/uploads/{filename}"
        return {"url": file_url, "filename": file.filename}
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload document")


@api_router.post("/blogs/{blog_id}/publish", response_model=BlogResponse)
async def publish_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    blog = await db.blogs.find_one({"blog_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    now = datetime.now(timezone.utc).isoformat()
    await db.blogs.update_one(
        {"blog_id": blog_id},
        {"$set": {"status": "published", "published_at": now, "updated_at": now}},
    )
    updated = await db.blogs.find_one({"blog_id": blog_id}, {"_id": 0})
    response = _blog_response(updated)

    await event_bus.publish({
        "type": "blog:new",
        "data": response.model_dump(mode="json"),
    })

    return response


@api_router.post("/blogs/{blog_id}/unpublish", response_model=BlogResponse)
async def unpublish_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    blog = await db.blogs.find_one({"blog_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    now = datetime.now(timezone.utc).isoformat()
    await db.blogs.update_one(
        {"blog_id": blog_id},
        {"$set": {"status": "draft", "published_at": None, "updated_at": now}},
    )
    updated = await db.blogs.find_one({"blog_id": blog_id}, {"_id": 0})
    return _blog_response(updated)


# --- Comments ---

@api_router.post("/blogs/{blog_id}/comments", response_model=CommentResponse)
async def add_comment(
    blog_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    blog = await db.blogs.find_one({"blog_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    now = datetime.now(timezone.utc).isoformat()
    comment = {
        "comment_id": str(uuid.uuid4()),
        "blog_id": blog_id,
        "parent_comment_id": comment_data.parent_comment_id,
        "author_email": current_user["email"],
        "author_username": current_user["username"],
        "author_full_name": current_user["full_name"],
        "content": comment_data.content,
        "upvotes": 0,
        "created_at": now,
    }
    await db.comments.insert_one(comment)
    await db.blogs.update_one({"blog_id": blog_id}, {"$inc": {"comment_count": 1}})
    comment.pop("_id", None)
    comment["created_at"] = parse_datetime(comment["created_at"])
    return CommentResponse(**comment)


@api_router.get("/blogs/{blog_id}/comments", response_model=List[CommentResponse])
async def get_comments(blog_id: str):
    comments = (
        await db.comments.find({"blog_id": blog_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(200)
    )
    result = []
    for c in comments:
        c["created_at"] = parse_datetime(c["created_at"])
        result.append(CommentResponse(**c))
    return result


# --- Reactions ---

@api_router.post("/blogs/{blog_id}/reactions")
async def toggle_reaction(
    blog_id: str,
    reaction_data: ReactionCreate,
    current_user: dict = Depends(get_current_user),
):
    valid_types = {"fire", "rocket", "bulb", "clap", "heart"}
    if reaction_data.type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid type. Use: {valid_types}")

    existing = await db.reactions.find_one({
        "blog_id": blog_id,
        "user_email": current_user["email"],
        "type": reaction_data.type,
    })
    if existing:
        await db.reactions.delete_one({"_id": existing["_id"]})
        await db.blogs.update_one({"blog_id": blog_id}, {"$inc": {"reaction_count": -1}})
        return {"action": "removed", "type": reaction_data.type}
    else:
        await db.reactions.insert_one({
            "blog_id": blog_id,
            "user_email": current_user["email"],
            "type": reaction_data.type,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.blogs.update_one({"blog_id": blog_id}, {"$inc": {"reaction_count": 1}})
        return {"action": "added", "type": reaction_data.type}


@api_router.get("/blogs/{blog_id}/reactions")
async def get_reactions(blog_id: str):
    pipeline = [
        {"$match": {"blog_id": blog_id}},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
    ]
    result = await db.reactions.aggregate(pipeline).to_list(10)
    return {r["_id"]: r["count"] for r in result}


# --- Bookmarks ---

@api_router.post("/blogs/{blog_id}/bookmark")
async def toggle_bookmark(
    blog_id: str,
    current_user: dict = Depends(get_current_user),
):
    existing = await db.bookmarks.find_one({
        "user_email": current_user["email"],
        "blog_id": blog_id,
    })
    if existing:
        await db.bookmarks.delete_one({"_id": existing["_id"]})
        return {"action": "removed"}
    else:
        await db.bookmarks.insert_one({
            "user_email": current_user["email"],
            "blog_id": blog_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"action": "added"}


@api_router.get("/bookmarks", response_model=List[BlogResponse])
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    bookmarks = await db.bookmarks.find(
        {"user_email": current_user["email"]}, {"_id": 0}
    ).to_list(100)
    blog_ids = [b["blog_id"] for b in bookmarks]
    blogs = await db.blogs.find({"blog_id": {"$in": blog_ids}}, {"_id": 0}).to_list(100)
    return [_blog_response(b) for b in blogs]


# ---------------------------------------------------------------------------
# SSE Stream Endpoint
# ---------------------------------------------------------------------------


@api_router.get("/stream/events")
async def sse_stream():
    """SSE endpoint — clients subscribe to real-time updates."""

    async def event_generator():
        queue = await event_bus.subscribe()
        try:
            # Send initial heartbeat so the client knows the connection is alive
            yield ": connected\n\n"
            while True:
                try:
                    # Wait for events with a timeout (heartbeat every 30s)
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"event: {event['type']}\ndata: {json.dumps(event['data'])}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat comment to keep connection alive
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            event_bus.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Mount router
# ---------------------------------------------------------------------------

app.include_router(api_router)
