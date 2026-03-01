from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="SepulangDinas API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== ENUMS ====================
class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class SubscriptionStatus(str, Enum):
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"

class Shift(str, Enum):
    PAGI = "PAGI"
    SIANG = "SIANG"
    MALAM = "MALAM"

class TicketCategory(str, Enum):
    TEKNIS = "Teknis"
    FINANCE = "Finance"

class TicketStatus(str, Enum):
    OPEN = "Open"
    ANSWERED = "Answered"
    CLOSED = "Closed"

# ==================== MODELS ====================
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: str
    picture: Optional[str] = None
    ruangan_rs: Optional[str] = None
    role: UserRole = UserRole.USER
    status_langganan: SubscriptionStatus = SubscriptionStatus.TRIAL
    berlaku_sampai: Optional[str] = None
    created_at: str

class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    patient_id: str
    user_id: str
    nama_pasien: str
    no_rm: str
    no_billing: Optional[str] = None
    diagnosa: Optional[str] = None
    created_at: str

class PatientCreate(BaseModel):
    nama_pasien: str
    no_rm: str
    no_billing: Optional[str] = None
    diagnosa: Optional[str] = None

class JenisPasien(str, Enum):
    PASIEN_BARU = "PASIEN_BARU"
    PASIEN_LAMA = "PASIEN_LAMA"
    PASIEN_PULANG = "PASIEN_PULANG"

class Ketergantungan(str, Enum):
    ADL_SELF_CARE = "ADL_SELF_CARE"
    ADL_PARTIAL_CARE = "ADL_PARTIAL_CARE"
    ADL_TOTAL_CARE = "ADL_TOTAL_CARE"

class TindakanItem(BaseModel):
    patient_id: str
    nama_pasien: str
    no_rm: str
    no_billing: Optional[str] = None
    diagnosa: Optional[str] = None
    jenis_pasien: JenisPasien = JenisPasien.PASIEN_LAMA
    ketergantungan: Ketergantungan = Ketergantungan.ADL_PARTIAL_CARE
    keterangan_tindakan: List[str] = []
    catatan_lainnya: Optional[str] = None
    # 13 Toggle switches (exactly as specified)
    oksigenasi: bool = False
    perawatan_luka_sederhana: bool = False
    pre_pasca_op: bool = False
    kompres_terbuka: bool = False
    memasang_infus_baru: bool = False
    memberikan_cairan_infus: bool = False
    memasang_ngt: bool = False
    transfusi_darah: bool = False
    nebu: bool = False
    memasang_dc_kateter: bool = False
    koreksi_caglukonas: bool = False
    koreksi_kcl: bool = False
    uji_lab: bool = False

class Logbook(BaseModel):
    model_config = ConfigDict(extra="ignore")
    logbook_id: str
    user_id: str
    tanggal_dinas: str
    shift: Shift
    jam_datang: str
    jam_pulang: str
    daftar_tindakan: List[TindakanItem] = []
    created_at: str

class LogbookCreate(BaseModel):
    tanggal_dinas: str
    shift: Shift
    jam_datang: str
    jam_pulang: str
    daftar_tindakan: List[TindakanItem] = []

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ticket_id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    kategori: TicketCategory
    subjek: str
    pesan_user: str
    status: TicketStatus = TicketStatus.OPEN
    balasan_admin: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class TicketCreate(BaseModel):
    kategori: TicketCategory
    subjek: str
    pesan_user: str

class TicketReply(BaseModel):
    balasan_admin: str

# ==================== DEMO ACCOUNTS ====================
DEMO_ACCOUNTS = {
    "admin@demo.com": {
        "password": "password",
        "name": "Demo Admin",
        "role": "ADMIN",
        "picture": "https://ui-avatars.com/api/?name=Demo+Admin&background=0d9488&color=fff"
    },
    "user@demo.com": {
        "password": "password", 
        "name": "Demo User",
        "role": "USER",
        "picture": "https://ui-avatars.com/api/?name=Demo+User&background=f97316&color=fff"
    }
}

# ==================== AUTH HELPERS ====================
async def get_session_from_cookie(request: Request) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    return session_doc

async def get_current_user(request: Request) -> User:
    session = await get_session_from_cookie(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

async def get_admin_user(request: Request) -> User:
    user = await get_current_user(request)
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        auth_data = auth_response.json()
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user with TRIAL status (7 days)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        trial_end = datetime.now(timezone.utc) + timedelta(days=7)
        
        new_user = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "picture": picture,
            "ruangan_rs": None,
            "role": UserRole.USER.value,
            "status_langganan": SubscriptionStatus.TRIAL.value,
            "berlaku_sampai": trial_end.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    return user.model_dump()

class DemoLoginRequest(BaseModel):
    email: str
    password: str

@api_router.post("/auth/demo-login")
async def demo_login(login_data: DemoLoginRequest, response: Response):
    """Login with demo credentials"""
    email = login_data.email
    password = login_data.password
    
    # Check if demo account exists
    if email not in DEMO_ACCOUNTS:
        raise HTTPException(status_code=401, detail="Invalid demo credentials")
    
    demo_account = DEMO_ACCOUNTS[email]
    
    # Verify password
    if password != demo_account["password"]:
        raise HTTPException(status_code=401, detail="Invalid demo credentials")
    
    # Check if user exists in DB
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create demo user
        user_id = f"demo_{uuid.uuid4().hex[:12]}"
        trial_end = datetime.now(timezone.utc) + timedelta(days=30)  # Demo gets 30 days
        
        new_user = {
            "user_id": user_id,
            "name": demo_account["name"],
            "email": email,
            "picture": demo_account["picture"],
            "ruangan_rs": "Demo Ruangan",
            "role": demo_account["role"],
            "status_langganan": SubscriptionStatus.ACTIVE.value,  # Demo is always active
            "berlaku_sampai": trial_end.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session token
    session_token = f"demo_session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {"user": user_doc, "session_token": session_token}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session = await get_session_from_cookie(request)
    if session:
        await db.user_sessions.delete_one({"user_id": session["user_id"]})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.put("/auth/profile")
async def update_profile(request: Request):
    """Update user profile"""
    user = await get_current_user(request)
    body = await request.json()
    
    update_data = {}
    if "ruangan_rs" in body:
        update_data["ruangan_rs"] = body["ruangan_rs"]
    if "name" in body:
        update_data["name"] = body["name"]
    
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

# ==================== PATIENT ROUTES ====================
@api_router.get("/patients", response_model=List[Patient])
async def get_patients(request: Request):
    """Get all patients for current user"""
    user = await get_current_user(request)
    patients = await db.patients.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("nama_pasien", 1).to_list(1000)
    return patients

@api_router.post("/patients", response_model=Patient, status_code=201)
async def create_patient(patient_data: PatientCreate, request: Request):
    """Create a new patient"""
    user = await get_current_user(request)
    
    patient = Patient(
        patient_id=f"patient_{uuid.uuid4().hex[:12]}",
        user_id=user.user_id,
        nama_pasien=patient_data.nama_pasien,
        no_rm=patient_data.no_rm,
        no_billing=patient_data.no_billing,
        diagnosa=patient_data.diagnosa,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.patients.insert_one(patient.model_dump())
    return patient

@api_router.get("/patients/search")
async def search_patients(request: Request, q: str = ""):
    """Search patients by name"""
    user = await get_current_user(request)
    
    query = {"user_id": user.user_id}
    if q:
        query["nama_pasien"] = {"$regex": q, "$options": "i"}
    
    patients = await db.patients.find(query, {"_id": 0}).limit(20).to_list(20)
    return patients

@api_router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, patient_data: PatientCreate, request: Request):
    """Update patient"""
    user = await get_current_user(request)
    
    result = await db.patients.update_one(
        {"patient_id": patient_id, "user_id": user.user_id},
        {"$set": patient_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    return patient

@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, request: Request):
    """Delete patient"""
    user = await get_current_user(request)
    
    result = await db.patients.delete_one(
        {"patient_id": patient_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": "Patient deleted"}

# ==================== LOGBOOK ROUTES ====================
@api_router.get("/logbooks")
async def get_logbooks(request: Request, month: Optional[int] = None, year: Optional[int] = None):
    """Get logbooks for current user, optionally filtered by month/year"""
    user = await get_current_user(request)
    
    query = {"user_id": user.user_id}
    
    # Filter by month/year if provided
    if month and year:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        query["tanggal_dinas"] = {"$gte": start_date, "$lt": end_date}
    
    logbooks = await db.logbooks.find(query, {"_id": 0}).sort("tanggal_dinas", -1).to_list(1000)
    return logbooks

@api_router.get("/logbooks/today")
async def get_today_logbook(request: Request):
    """Get today's logbook for current user"""
    user = await get_current_user(request)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    logbook = await db.logbooks.find_one(
        {"user_id": user.user_id, "tanggal_dinas": today},
        {"_id": 0}
    )
    
    return logbook

@api_router.post("/logbooks", response_model=Logbook, status_code=201)
async def create_logbook(logbook_data: LogbookCreate, request: Request):
    """Create a new logbook entry"""
    user = await get_current_user(request)
    
    # Check if logbook for this date already exists
    existing = await db.logbooks.find_one({
        "user_id": user.user_id,
        "tanggal_dinas": logbook_data.tanggal_dinas
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Logbook untuk tanggal ini sudah ada")
    
    logbook = Logbook(
        logbook_id=f"logbook_{uuid.uuid4().hex[:12]}",
        user_id=user.user_id,
        tanggal_dinas=logbook_data.tanggal_dinas,
        shift=logbook_data.shift,
        jam_datang=logbook_data.jam_datang,
        jam_pulang=logbook_data.jam_pulang,
        daftar_tindakan=logbook_data.daftar_tindakan,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.logbooks.insert_one(logbook.model_dump())
    return logbook

@api_router.put("/logbooks/{logbook_id}")
async def update_logbook(logbook_id: str, logbook_data: LogbookCreate, request: Request):
    """Update logbook"""
    user = await get_current_user(request)
    
    update_dict = logbook_data.model_dump()
    update_dict["daftar_tindakan"] = [t.model_dump() if hasattr(t, 'model_dump') else t for t in logbook_data.daftar_tindakan]
    
    result = await db.logbooks.update_one(
        {"logbook_id": logbook_id, "user_id": user.user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Logbook not found")
    
    logbook = await db.logbooks.find_one({"logbook_id": logbook_id}, {"_id": 0})
    return logbook

@api_router.delete("/logbooks/{logbook_id}")
async def delete_logbook(logbook_id: str, request: Request):
    """Delete logbook"""
    user = await get_current_user(request)
    
    result = await db.logbooks.delete_one(
        {"logbook_id": logbook_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Logbook not found")
    
    return {"message": "Logbook deleted"}

@api_router.post("/logbooks/{logbook_id}/tindakan")
async def add_tindakan(logbook_id: str, tindakan: TindakanItem, request: Request):
    """Add tindakan to existing logbook"""
    user = await get_current_user(request)
    
    result = await db.logbooks.update_one(
        {"logbook_id": logbook_id, "user_id": user.user_id},
        {"$push": {"daftar_tindakan": tindakan.model_dump()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Logbook not found")
    
    logbook = await db.logbooks.find_one({"logbook_id": logbook_id}, {"_id": 0})
    return logbook

# ==================== TICKET ROUTES ====================
@api_router.get("/tickets")
async def get_user_tickets(request: Request):
    """Get tickets for current user"""
    user = await get_current_user(request)
    
    tickets = await db.tickets.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return tickets

@api_router.post("/tickets", response_model=Ticket, status_code=201)
async def create_ticket(ticket_data: TicketCreate, request: Request):
    """Create a new support ticket"""
    user = await get_current_user(request)
    
    ticket = Ticket(
        ticket_id=f"ticket_{uuid.uuid4().hex[:12]}",
        user_id=user.user_id,
        user_name=user.name,
        user_email=user.email,
        kategori=ticket_data.kategori,
        subjek=ticket_data.subjek,
        pesan_user=ticket_data.pesan_user,
        status=TicketStatus.OPEN,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.tickets.insert_one(ticket.model_dump())
    return ticket

# ==================== ADMIN ROUTES ====================
@api_router.get("/admin/users")
async def get_all_users(request: Request):
    """Get all users (admin only)"""
    await get_admin_user(request)
    
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.get("/admin/tickets")
async def get_all_tickets(request: Request):
    """Get all tickets (admin only)"""
    await get_admin_user(request)
    
    tickets = await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return tickets

@api_router.put("/admin/tickets/{ticket_id}/reply")
async def reply_ticket(ticket_id: str, reply_data: TicketReply, request: Request):
    """Reply to a ticket (admin only)"""
    await get_admin_user(request)
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "balasan_admin": reply_data.balasan_admin,
            "status": TicketStatus.ANSWERED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return ticket

@api_router.put("/admin/tickets/{ticket_id}/close")
async def close_ticket(ticket_id: str, request: Request):
    """Close a ticket (admin only)"""
    await get_admin_user(request)
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "status": TicketStatus.CLOSED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return ticket

@api_router.delete("/admin/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, request: Request):
    """Delete a ticket (admin only)"""
    await get_admin_user(request)
    
    result = await db.tickets.delete_one({"ticket_id": ticket_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True}


@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    """Update user role (admin only)"""
    await get_admin_user(request)
    body = await request.json()
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": body.get("role", UserRole.USER.value)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    """Get admin dashboard stats"""
    await get_admin_user(request)
    
    total_users = await db.users.count_documents({})
    active_subscribers = await db.users.count_documents({"status_langganan": "ACTIVE"})
    trial_users = await db.users.count_documents({"status_langganan": "TRIAL"})
    open_tickets = await db.tickets.count_documents({"status": "Open"})
    
    return {
        "total_users": total_users,
        "active_subscribers": active_subscribers,
        "trial_users": trial_users,
        "open_tickets": open_tickets
    }

# ==================== BILLING/MIDTRANS ROUTES (PLACEHOLDER) ====================
@api_router.post("/billing/create-transaction")
async def create_transaction(request: Request):
    """Create Midtrans transaction (PLACEHOLDER)"""
    # Verify user is authenticated
    await get_current_user(request)
    
    # PLACEHOLDER: This would integrate with Midtrans Snap
    # For now, return mock data
    return {
        "token": "mock_snap_token_" + uuid.uuid4().hex[:8],
        "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock",
        "message": "MOCK: Midtrans integration placeholder"
    }

@api_router.post("/webhook/midtrans")
async def midtrans_webhook(request: Request):
    """Midtrans webhook handler (PLACEHOLDER)"""
    # PLACEHOLDER: Process webhook data
    _ = await request.json()
    
    # PLACEHOLDER: Validate signature and update subscription status
    # transaction_status = body.get("transaction_status")
    # order_id = body.get("order_id")
    
    return {"status": "ok"}

# ==================== HEALTH CHECK ====================
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
