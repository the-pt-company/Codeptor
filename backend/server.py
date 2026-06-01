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
from firebase_admin import auth as firebase_auth
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv 
from pydantic import BaseModel, Field, EmailStr, ConfigDict 
from passlib.context import CryptContext
from jose import JWTError, jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import requests

from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud import firestore

from database import db, bucket


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
        logger.error(f"SMTP not configured! Password reset email NOT sent to {email}")
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
        logger.info(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email to {email}")
        logger.error(f"   Error type: {type(e).__name__}")
        logger.error(f"   Error: {str(e)}")
        logger.error(f"   Reset link: {reset_link}")
        return False

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        email: str = decoded_token.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception as e:
        logger.error(f"Firebase auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    doc = await db.collection("users").document(email).get()
    user = doc.to_dict() if doc.exists else None
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
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        email: str = decoded_token.get("email")
        if not email:
            return None
    except Exception:
        return None
    doc = await db.collection("users").document(email).get()
    user = doc.to_dict() if doc.exists else None
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


class AuthSyncRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None


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
    video_cv_url: Optional[str] = None
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
    video_cv_url: Optional[str] = None
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
    video_cv_url: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None


class ProjectCreate(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    category: str
    status: str = "in_progress"
    visibility: str = "public"
    thumbnail_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: str  # Mandatory for contribution
    documentation_url: Optional[str] = None
    video_url: Optional[str] = None
    media_urls: List[str] = []


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None
    visibility: Optional[str] = None
    thumbnail_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    documentation_url: Optional[str] = None
    video_url: Optional[str] = None
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
    visibility: str = "public"
    thumbnail_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    documentation_url: Optional[str] = None
    video_url: Optional[str] = None
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
    """Build a UserResponse from a raw Firestore document."""
    return UserResponse(email=user["email"], full_name=user["full_name"], username=user["username"], bio=user.get("bio"), avatar_url=user.get("avatar_url"), github_url=user.get("github_url"), linkedin_url=user.get("linkedin_url"), website_url=user.get("website_url"), video_cv_url=user.get("video_cv_url"), location=user.get("location"), skills=user.get("skills", []), created_at=parse_datetime(user["created_at"]))  # type: ignore


async def _developer_response(user: dict) -> DeveloperResponse:
    """Build a DeveloperResponse from a raw Firestore document including project count."""
    docs = await db.collection("projects").where(filter=FieldFilter("user_username", "==", user["username"])).get()
    count = len(docs)
    return DeveloperResponse(full_name=user["full_name"], username=user["username"], bio=user.get("bio"), avatar_url=user.get("avatar_url"), github_url=user.get("github_url"), linkedin_url=user.get("linkedin_url"), website_url=user.get("website_url"), video_cv_url=user.get("video_cv_url"), location=user.get("location"), skills=user.get("skills", []), created_at=parse_datetime(user["created_at"]), project_count=count)  # type: ignore


def _project_response(project: dict) -> ProjectResponse:  # type: ignore
    """Build a ProjectResponse from a raw Firestore document."""
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
    p["visibility"] = p.get("visibility", "public")
    
    return ProjectResponse(**p)


def _project_is_owner(project: dict, current_user: Optional[dict]) -> bool:
    return bool(current_user and project.get("user_email") == current_user.get("email"))


def _ensure_project_visible(project: dict, current_user: Optional[dict]) -> None:
    visibility = project.get("visibility", "public")
    if visibility == "private" and not _project_is_owner(project, current_user):
        raise HTTPException(status_code=404, detail="Project not found")


def _serialize(doc: dict) -> dict:
    """Sanitize a Firestore doc for SSE broadcast."""
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
    # Startup — verify Firebase connection implicitly or explicitly
    try:
        # Just a dummy fetch to ensure db is accessible
        await db.collection('users').limit(1).get()
        logger.info("Successfully connected to Firestore")
    except Exception as e:
        logger.error("Failed to connect to Firestore: %s", e)

    # Startup — verify SMTP configuration
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.warning("SMTP NOT CONFIGURED - Password reset emails WILL NOT be sent")
        logger.warning("   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env")
    else:
        logger.info(f"SMTP configured: {SMTP_USER} @ {SMTP_HOST}:{SMTP_PORT}")

    # Start Change Stream watchers as background tasks - REMOVED FOR FIREBASE
    # Realtime updates will rely solely on event_bus.publish calls made during mutations.

    yield

    # Shutdown
    pass

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
    "https://kudos-dev-eight.vercel.app",
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


@api_router.post("/auth/sync", response_model=UserResponse)
async def sync_user(
    data: AuthSyncRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Syncs a Firebase user with the Firestore users collection.
    Called after successful sign-in on the frontend.
    """
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token.get("email")
        uid = decoded_token.get("uid")
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token: email missing")
    except Exception as e:
        logger.error(f"Sync verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    doc_ref = db.collection("users").document(email)
    doc = await doc_ref.get()
    
    if doc.exists:
        # Update existing user with latest info from Firebase if provided
        update_data = {}
        if data.full_name: update_data["full_name"] = data.full_name
        if data.avatar_url: update_data["avatar_url"] = data.avatar_url
        # Always update UID just in case
        update_data["uid"] = uid
        
        await doc_ref.update(update_data)
        user_dict = (await doc_ref.get()).to_dict()
    else:
        # Create new user record
        # If username not provided, generate one from email
        username = data.username or email.split("@")[0].lower()
        # Ensure username uniqueness
        username_check = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
        if username_check:
            username = f"{username}_{str(uuid.uuid4())[:4]}"

        user_dict = {
            "email": email,
            "uid": uid,
            "full_name": data.full_name or email.split("@")[0],
            "username": username,
            "bio": None,
            "avatar_url": data.avatar_url,
            "github_url": None,
            "linkedin_url": None,
            "website_url": None,
            "video_cv_url": None,
            "location": None,
            "skills": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await doc_ref.set(user_dict)

    return _user_response(user_dict)


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)


@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}

    if update_data:
        await db.collection("users").document(current_user["email"]).update(update_data)

    doc = await db.collection("users").document(current_user["email"]).get()
    updated_user = doc.to_dict()
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

    doc = await db.collection("users").document(request.email).get()
    user = doc.to_dict() if doc.exists else None
    if not user:
        # Return the same generic message so as not to reveal whether an account exists
        logger.warning(f"Password reset requested for non-existent email: {request.email}")
        return {"message": "If an account exists with this email, a reset link has been sent."}

    reset_token_id = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    token_data = {"sub": request.email, "type": "reset", "jti": reset_token_id, "exp": expire}
    reset_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    await db.collection("users").document(request.email).update({
        "reset_token_id": reset_token_id,
        "reset_token_expires_at": expire.isoformat(),
    })
    email_sent = await send_reset_email(request.email, reset_token)
    if not email_sent:
        await db.collection("users").document(request.email).update({
            "reset_token_id": firestore.DELETE_FIELD, 
            "reset_token_expires_at": firestore.DELETE_FIELD
        })
        raise HTTPException(
            status_code=502,
            detail="We couldn't send the reset email right now. Please try again later.",
        )

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

    doc = await db.collection("users").document(email).get()
    user = doc.to_dict() if doc.exists else None
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    stored_token_id = user.get("reset_token_id")
    stored_expiry = user.get("reset_token_expires_at")
    if stored_token_id != token_id or not stored_expiry:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used")

    if parse_datetime(stored_expiry) < datetime.now(timezone.utc):
        # Clean up expired token
        await db.collection("users").document(email).update({
            "reset_token_id": firestore.DELETE_FIELD, 
            "reset_token_expires_at": firestore.DELETE_FIELD
        })
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

    doc = await db.collection("users").document(email).get()
    user = doc.to_dict() if doc.exists else None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_token_id = user.get("reset_token_id")
    stored_expiry = user.get("reset_token_expires_at")
    if stored_token_id != token_id or not stored_expiry:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used")

    if parse_datetime(stored_expiry) < datetime.now(timezone.utc):
        await db.collection("users").document(email).update({
            "reset_token_id": firestore.DELETE_FIELD, 
            "reset_token_expires_at": firestore.DELETE_FIELD
        })
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    validate_password_strength(data.new_password)

    hashed_password = get_password_hash(data.new_password)
    await db.collection("users").document(email).update({
        "password": hashed_password,
        "reset_token_id": firestore.DELETE_FIELD,
        "reset_token_expires_at": firestore.DELETE_FIELD,
    })

    return {"message": "Password reset successfully"}


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
    
    # Firestore doesn't support OR queries natively like MongoDB for text search, 
    # and doesn't do regex. We fetch all users and filter in memory since user base is small.
    # We apply limit and skip in memory too.
    all_users_docs = await db.collection("users").get()
    all_users = [d.to_dict() for d in all_users_docs]
    if q:
        q_lower = q.lower()
        all_users = [u for u in all_users if q_lower in u.get("full_name", "").lower() or q_lower in u.get("username", "").lower()]
    users = all_users[skip : skip + limit]
    
    developers = []
    for u in users:
        dev = await _developer_response(u)
        developers.append(dev)
    
    return developers


@api_router.get("/users/{username}", response_model=UserResponse)
async def get_user_by_username(username: str):
    docs = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
    user = docs[0].to_dict() if docs else None
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

    docs = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
    target = docs[0].to_dict() if docs else None
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate follows
    existing_doc = await db.collection("follows").document(f"{current_user['email']}||{target['email']}").get()
    existing = existing_doc.to_dict() if existing_doc.exists else None
    if existing:
        return {"message": "Already following"}

    await db.collection("follows").document(f"{current_user['email']}||{target['email']}").set({
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
    docs = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
    target = docs[0].to_dict() if docs else None
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    await db.collection("follows").document(f"{current_user['email']}||{target['email']}").delete()
    return {"message": "Unfollowed successfully"}


@api_router.get("/users/{username}/followers")
async def get_followers(username: str):
    """Get list of users who follow this user."""
    docs = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
    target = docs[0].to_dict() if docs else None
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    follows_docs = await db.collection("follows").where(filter=FieldFilter("following_email", "==", target["email"])).limit(500).get()
    follows = [d.to_dict() for d in follows_docs]

    follower_emails = [f["follower_email"] for f in follows]
    if not follower_emails:
        return []

    user_refs = [db.collection("users").document(email) for email in follower_emails]
    users = [doc.to_dict() async for doc in db.get_all(user_refs) if doc.exists]
    return users


@api_router.get("/users/{username}/following")
async def get_following(username: str):
    """Get list of users this user follows."""
    docs = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
    target = docs[0].to_dict() if docs else None
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    follows_docs = await db.collection("follows").where(filter=FieldFilter("follower_email", "==", target["email"])).limit(500).get()
    follows = [d.to_dict() for d in follows_docs]

    following_emails = [f["following_email"] for f in follows]
    if not following_emails:
        return []

    user_refs = [db.collection("users").document(email) for email in following_emails]
    users = [doc.to_dict() async for doc in db.get_all(user_refs) if doc.exists]
    return users


@api_router.get("/users/{username}/is-following")
async def check_is_following(username: str, current_user: dict = Depends(get_current_user)):
    """Check if current user follows this user."""
    docs = await db.collection("users").where(filter=FieldFilter("username", "==", username)).limit(1).get()
    target = docs[0].to_dict() if docs else None
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing_doc = await db.collection("follows").document(f"{current_user['email']}||{target['email']}").get()
    existing = existing_doc.to_dict() if existing_doc.exists else None
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
    project_dict["visibility"] = project_dict.get("visibility") or "public"
    project_dict["created_at"] = now
    project_dict["updated_at"] = now

    await db.collection("projects").document(project_dict["project_id"]).set(project_dict)

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
    query: dict[str, Any] = {"visibility": "public"}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    
    if exclude_self and current_user:
        query["user_email"] = {"$ne": current_user["email"]}
        query["github_url"] = {"$exists": True, "$nin": [None, ""]}

    col_ref = db.collection("projects")
    if category:
        col_ref = col_ref.where(filter=FieldFilter("category", "==", category))
    if status:
        col_ref = col_ref.where(filter=FieldFilter("status", "==", status))
    col_ref = col_ref.where(filter=FieldFilter("visibility", "==", "public"))
    
    docs = await col_ref.get()
    projects = [d.to_dict() for d in docs]
    projects.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    projects = projects[:100]
    
    if exclude_self and current_user:
        projects = [p for p in projects if p.get("user_email") != current_user["email"] and p.get("github_url")]
    return [_project_response(p) for p in projects]


@api_router.get("/projects/my", response_model=List[ProjectResponse])
async def get_my_projects(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Fetching projects for user: {current_user['email']}")
        docs = await db.collection("projects").where(filter=FieldFilter("user_email", "==", current_user["email"])).get()
        projects = [d.to_dict() for d in docs]
        projects.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        projects = projects[:100]
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
async def get_user_projects(username: str, current_user: Optional[dict] = Depends(get_optional_user)):
    query: dict[str, Any] = {"user_username": username}
    if not current_user or current_user.get("username") != username:
        query["visibility"] = "public"

    col_ref = db.collection("projects").where(filter=FieldFilter("user_username", "==", username))
    if "visibility" in query:
        col_ref = col_ref.where(filter=FieldFilter("visibility", "==", "public"))
    docs = await col_ref.get()
    projects = [d.to_dict() for d in docs]
    projects.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_project_response(p) for p in projects[:100]]


@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    doc = await db.collection("projects").document(project_id).get()
    project = doc.to_dict() if doc.exists else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _ensure_project_visible(project, current_user)
    return _project_response(project)


@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    doc = await db.collection("projects").document(project_id).get()
    project = doc.to_dict() if doc.exists else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project["user_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")

    update_data = {k: v for k, v in project_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.collection("projects").document(project_id).update(update_data)

    updated_doc = await db.collection("projects").document(project_id).get()
    project = updated_doc.to_dict() if updated_doc.exists else None
    response = _project_response(project)
    await event_bus.publish({
        "type": "project:updated",
        "data": response.model_dump(mode="json"),
    })
    return response


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"Attempting to delete project: {project_id} by user: {current_user['email']}")
    doc = await db.collection("projects").document(project_id).get()
    project = doc.to_dict() if doc.exists else None
    if not project:
        logger.warning(f"Project not found: {project_id}")
        raise HTTPException(status_code=404, detail="Project not found")

    if project["user_email"] != current_user["email"]:
        logger.warning(f"Unauthorized deletion attempt for project {project_id} by {current_user['email']}")
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")

    await db.collection("projects").document(project_id).delete()
    logger.info(f"Project deleted: {project_id}")

    await event_bus.publish({
        "type": "project:deleted",
        "data": {"project_id": project_id},
    })

    return {"message": "Project deleted successfully"}


# --- Project Discussion Endpoints ---

@api_router.get("/projects/{project_id}/comments", response_model=List[ProjectCommentResponse])
async def get_project_comments(project_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    doc = await db.collection("projects").document(project_id).get()
    project = doc.to_dict() if doc.exists else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _ensure_project_visible(project, current_user)

    docs = await db.collection("project_comments").where(filter=FieldFilter("project_id", "==", project_id)).get()
    comments = [d.to_dict() for d in docs]
    comments.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return comments[:100]


@api_router.post("/projects/{project_id}/comments", response_model=ProjectCommentResponse)
async def add_project_comment(
    project_id: str,
    comment: ProjectComment,
    current_user: dict = Depends(get_current_user),
):
    doc = await db.collection("projects").document(project_id).get()
    project = doc.to_dict() if doc.exists else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _ensure_project_visible(project, current_user)

    new_comment = {
        "comment_id": str(uuid.uuid4()),
        "project_id": project_id,
        "user_email": current_user["email"],
        "user_username": current_user["username"],
        "content": comment.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.collection("project_comments").document(new_comment["comment_id"]).set(new_comment)
    
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
    """Build a BlogResponse from a raw Firestore document."""
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
    await db.collection("blogs").document(blog_dict["blog_id"]).set(blog_dict)

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
    col_ref = db.collection("blogs").where(filter=FieldFilter("status", "==", "published"))
    if tag:
        col_ref = col_ref.where(filter=FieldFilter("tags", "array_contains", tag))
    if category:
        col_ref = col_ref.where(filter=FieldFilter("category", "==", category))
    col_ref = col_ref.order_by("published_at", direction=firestore.Query.DESCENDING).offset(skip).limit(limit)
    docs = await col_ref.get()
    blogs = [d.to_dict() for d in docs]
    return [_blog_response(b) for b in blogs]


@api_router.get("/blogs/my", response_model=List[BlogResponse])
async def get_my_blogs(current_user: dict = Depends(get_current_user)):
    docs = await db.collection("blogs").where(filter=FieldFilter("author_email", "==", current_user["email"])).order_by("updated_at", direction=firestore.Query.DESCENDING).limit(100).get()
    blogs = [d.to_dict() for d in docs]
    return [_blog_response(b) for b in blogs]


@api_router.get("/blogs/{slug}", response_model=BlogResponse)
async def get_blog_by_slug(
    slug: str,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    docs = await db.collection("blogs").where(filter=FieldFilter("slug", "==", slug)).limit(1).get()
    blog = docs[0].to_dict() if docs else None
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    # Only increment view_count if the viewer is NOT the author
    is_author = current_user and current_user.get("email") == blog.get("author_email")
    if not is_author:
        await db.collection("blogs").document(blog["blog_id"]).update({"view_count": firestore.Increment(1)})
        blog["view_count"] = blog.get("view_count", 0) + 1

    return _blog_response(blog)


@api_router.put("/blogs/{blog_id}", response_model=BlogResponse)
async def update_blog(
    blog_id: str,
    blog_update: BlogUpdate,
    current_user: dict = Depends(get_current_user),
):
    doc = await db.collection("blogs").document(blog_id).get()
    blog = doc.to_dict() if doc.exists else None
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data: dict[str, Any] = {k: v for k, v in blog_update.model_dump().items() if v is not None}
    if "content_markdown" in update_data:
        update_data["word_count"] = len(update_data["content_markdown"].split())
        update_data["reading_time_minutes"] = calculate_reading_time(update_data["content_markdown"])
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.collection("blogs").document(blog_id).update(update_data)
    doc = await db.collection("blogs").document(blog_id).get()
    updated = doc.to_dict() if doc.exists else None
    response = _blog_response(updated)

    await event_bus.publish({
        "type": "blog:updated",
        "data": response.model_dump(mode="json"),
    })

    return response


@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"Attempting to delete blog: {blog_id} by user: {current_user['email']}")
    doc = await db.collection("blogs").document(blog_id).get()
    blog = doc.to_dict() if doc.exists else None
    if not blog:
        logger.warning(f"Blog not found: {blog_id}")
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        logger.warning(f"Unauthorized deletion attempt for blog {blog_id} by {current_user['email']}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.collection("blogs").document(blog_id).delete()
    comments_docs = await db.collection("comments").where(filter=FieldFilter("blog_id", "==", blog_id)).get()
    for d in comments_docs:
        await d.reference.delete()
    reactions_docs = await db.collection("reactions").where(filter=FieldFilter("blog_id", "==", blog_id)).get()
    for d in reactions_docs:
        await d.reference.delete()
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
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    filename = f"blogs/{uuid.uuid4()}{ext}"
    try:
        blob = bucket.blob(filename)
        blob.upload_from_string(content, content_type=file.content_type)
        blob.make_public()
        return {"url": blob.public_url}
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


@api_router.post("/projects/upload-image")
async def upload_project_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a thumbnail/screenshot image for a project (max 10 MB)."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if not file.content_type or not file.content_type.startswith("image/") or ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file. Allowed image types: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    filename = f"projects/images/{uuid.uuid4()}{ext}"
    try:
        blob = bucket.blob(filename)
        blob.upload_from_string(content, content_type=file.content_type)
        blob.make_public()
        return {"url": blob.public_url, "filename": file.filename}
    except Exception as e:
        logger.error(f"Project image upload failed: {e}")
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

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    filename = f"projects/docs/{uuid.uuid4()}{ext}"
    try:
        blob = bucket.blob(filename)
        blob.upload_from_string(content, content_type=file.content_type)
        blob.make_public()
        return {"url": blob.public_url, "filename": file.filename}
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload document")


@api_router.post("/blogs/{blog_id}/publish", response_model=BlogResponse)
async def publish_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.collection("blogs").document(blog_id).get()
    blog = doc.to_dict() if doc.exists else None
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    now = datetime.now(timezone.utc).isoformat()
    await db.collection("blogs").document(blog_id).update({"status": "published", "published_at": now, "updated_at": now})
    doc = await db.collection("blogs").document(blog_id).get()
    updated = doc.to_dict() if doc.exists else None
    response = _blog_response(updated)

    await event_bus.publish({
        "type": "blog:new",
        "data": response.model_dump(mode="json"),
    })

    return response


@api_router.post("/blogs/{blog_id}/unpublish", response_model=BlogResponse)
async def unpublish_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.collection("blogs").document(blog_id).get()
    blog = doc.to_dict() if doc.exists else None
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    now = datetime.now(timezone.utc).isoformat()
    await db.collection("blogs").document(blog_id).update({"status": "draft", "published_at": None, "updated_at": now})
    doc = await db.collection("blogs").document(blog_id).get()
    updated = doc.to_dict() if doc.exists else None
    return _blog_response(updated)


# --- Comments ---

@api_router.post("/blogs/{blog_id}/comments", response_model=CommentResponse)
async def add_comment(
    blog_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    doc = await db.collection("blogs").document(blog_id).get()
    blog = doc.to_dict() if doc.exists else None
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
    await db.collection("comments").document(comment["comment_id"]).set(comment)
    await db.collection("blogs").document(blog_id).update({"comment_count": firestore.Increment(1)})
    comment.pop("_id", None)
    comment["created_at"] = parse_datetime(comment["created_at"])
    return CommentResponse(**comment)


@api_router.get("/blogs/{blog_id}/comments", response_model=List[CommentResponse])
async def get_comments(blog_id: str):
    docs = await db.collection("comments").where(filter=FieldFilter("blog_id", "==", blog_id)).get()
    comments = [d.to_dict() for d in docs]
    comments.sort(key=lambda x: x.get("created_at", ""))
    comments = comments[:200]
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

    doc_id = f"{blog_id}||{current_user['email']}||{reaction_data.type}"
    existing_doc = await db.collection("reactions").document(doc_id).get()
    existing = existing_doc.to_dict() if existing_doc.exists else None
    if existing:
        await db.collection("reactions").document(doc_id).delete()
        await db.collection("blogs").document(blog_id).update({"reaction_count": firestore.Increment(-1)})
        return {"action": "removed", "type": reaction_data.type}
    else:
        await db.collection("reactions").document(doc_id).set({
            "blog_id": blog_id,
            "user_email": current_user["email"],
            "type": reaction_data.type,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.collection("blogs").document(blog_id).update({"reaction_count": firestore.Increment(1)})
        return {"action": "added", "type": reaction_data.type}


@api_router.get("/blogs/{blog_id}/reactions")
async def get_reactions(blog_id: str):
    docs = await db.collection("reactions").where(filter=FieldFilter("blog_id", "==", blog_id)).get()
    counts = {}
    for d in docs:
        t = d.to_dict()["type"]
        counts[t] = counts.get(t, 0) + 1
    return counts


# --- Bookmarks ---

@api_router.post("/blogs/{blog_id}/bookmark")
async def toggle_bookmark(
    blog_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc_id = f"{current_user['email']}||{blog_id}"
    existing_doc = await db.collection("bookmarks").document(doc_id).get()
    existing = existing_doc.to_dict() if existing_doc.exists else None
    if existing:
        await db.collection("bookmarks").document(doc_id).delete()
        return {"action": "removed"}
    else:
        await db.collection("bookmarks").document(doc_id).set({
            "user_email": current_user["email"],
            "blog_id": blog_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"action": "added"}


@api_router.get("/bookmarks", response_model=List[BlogResponse])
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    docs = await db.collection("bookmarks").where(filter=FieldFilter("user_email", "==", current_user["email"])).limit(100).get()
    bookmarks = [d.to_dict() for d in docs]
    blog_ids = [b["blog_id"] for b in bookmarks]
    if not blog_ids:
        return []
    blog_refs = [db.collection("blogs").document(bid) for bid in blog_ids]
    blogs = [doc.to_dict() async for doc in db.get_all(blog_refs) if doc.exists]
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
# Newsletter subscription
# ---------------------------------------------------------------------------


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr


async def send_newsletter_notification(subscriber_email: str) -> bool:
    """Notify kudosdev7@gmail.com that someone wants to join the community newsletter."""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.error("SMTP not configured; cannot send newsletter notification.")
        return False

    msg = EmailMessage()
    msg["Subject"] = "New Newsletter Subscription Request"
    msg["From"] = SMTP_FROM
    msg["To"] = SMTP_FROM  # notify the KudosD team inbox
    msg["Reply-To"] = subscriber_email
    msg.set_content(
        f"A new user wants to join the KudosDev community newsletter.\n\n"
        f"Subscriber email: {subscriber_email}\n\n"
        f"Please add them to your mailing list.\n\n"
        f"— KudosDev automated notification"
    )

    try:
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
            timeout=10,
        )
        logger.info(f"Newsletter notification sent for subscriber: {subscriber_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send newsletter notification: {type(e).__name__}: {e}")
        return False


@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(request: NewsletterSubscribeRequest):
    """Receive a community newsletter subscription and notify the KudosDev team."""
    sent = await send_newsletter_notification(request.email)
    if not sent:
        raise HTTPException(
            status_code=502,
            detail="Could not process your subscription right now. Please try again later.",
        )
    return {"message": "Thank you! You have been added to the KudosDev community list."}


# ---------------------------------------------------------------------------
# Mount router
# ---------------------------------------------------------------------------

app.include_router(api_router)
