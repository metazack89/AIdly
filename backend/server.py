from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import boto3
from botocore.exceptions import ClientError
import phonenumbers
from phonenumbers import NumberParseException
from geopy.geocoders import Nominatim
import json
import aiohttp
import asyncio
from jose import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
security = HTTPBearer(auto_error=False)
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
geolocator = Nominatim(user_agent="aidly_emergency_app")

# AWS SNS setup
try:
    sns_client = boto3.client(
        'sns',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION', 'us-east-1')
    )
except Exception:
    sns_client = None
    logging.warning("AWS SNS client not configured")

# Image generation setup
image_gen = None
try:
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if api_key:
        image_gen = OpenAIImageGeneration(api_key=api_key)
except Exception as e:
    logging.warning(f"Image generation not configured: {e}")

app = FastAPI(title="Aidly - Medical Emergency Assistant")
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    google_id: Optional[str] = None
    session_token: Optional[str] = None
    session_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    emergency_contacts: List[Dict[str, Any]] = Field(default_factory=list)
    location_enabled: bool = False
    emergency_number: str = "911"  # Default to US, will be updated based on location

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    google_id: Optional[str] = None

class EmergencyContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    relationship: str
    priority: int = 1  # 1 = highest priority

class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str
    priority: int = 1

class LocationData(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    address: Optional[str] = None

class EmergencyAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    emergency_type: str  # "medical", "fire", "police", "general"
    location: Optional[LocationData] = None
    message: str
    contacts_notified: List[str] = Field(default_factory=list)
    emergency_services_called: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    status: str = "active"  # "active", "resolved", "cancelled"

class SOSRequest(BaseModel):
    emergency_type: str = "medical"
    location: Optional[LocationData] = None
    custom_message: Optional[str] = None

class MedicalProcedure(BaseModel):
    id: str
    name: str
    description: str
    steps: List[Dict[str, Any]]
    category: str  # "cpr", "choking", "burns", "wounds", "general"
    difficulty: str  # "basic", "intermediate", "advanced"
    duration_minutes: int
    images: List[str] = Field(default_factory=list)
    voice_instructions: bool = True

class AuthSession(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str]
    session_token: str

# Authentication helper functions
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current user from session token"""
    if not credentials:
        return None
    
    try:
        # Find user by session token
        user_data = await db.users.find_one({
            "session_token": credentials.credentials,
            "session_expires": {"$gt": datetime.now(timezone.utc)}
        })
        
        if user_data:
            return User(**user_data)
    except Exception as e:
        logging.error(f"Auth error: {e}")
    
    return None

async def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authenticated user"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# Authentication endpoints
@api_router.post("/auth/session-data", response_model=SessionResponse)
async def process_session(auth_session: AuthSession, x_session_id: Optional[str] = Header(None)):
    """Process Emergent Auth session ID and create user session"""
    session_id = x_session_id or auth_session.session_id
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    try:
        # Call Emergent Auth API to get user data
        async with aiohttp.ClientSession() as session:
            headers = {"X-Session-ID": session_id}
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers=headers
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail="Invalid session ID")
                
                user_data = await response.json()
        
        # Create or update user
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        # Generate session token
        session_token = str(uuid.uuid4())
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        
        if existing_user:
            # Update existing user
            await db.users.update_one(
                {"email": user_data["email"]},
                {
                    "$set": {
                        "session_token": session_token,
                        "session_expires": session_expires,
                        "name": user_data["name"],
                        "profile_picture": user_data.get("picture")
                    }
                }
            )
            user_id = existing_user["id"]
        else:
            # Create new user
            new_user = User(
                email=user_data["email"],
                name=user_data["name"],
                profile_picture=user_data.get("picture"),
                google_id=user_data["id"],
                session_token=session_token,
                session_expires=session_expires
            )
            await db.users.insert_one(new_user.dict())
            user_id = new_user.id
        
        return SessionResponse(
            id=user_id,
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture"),
            session_token=session_token
        )
    
    except aiohttp.ClientError:
        raise HTTPException(status_code=400, detail="Failed to validate session")
    except Exception as e:
        logging.error(f"Session processing error: {e}")
        raise HTTPException(status_code=500, detail="Session processing failed")

@api_router.post("/auth/logout")
async def logout(user: User = Depends(require_auth)):
    """Logout user and invalidate session"""
    await db.users.update_one(
        {"id": user.id},
        {"$unset": {"session_token": "", "session_expires": ""}}
    )
    return {"message": "Logged out successfully"}

# User profile endpoints
@api_router.get("/profile", response_model=User)
async def get_profile(user: User = Depends(require_auth)):
    """Get current user profile"""
    return user

@api_router.put("/profile")
async def update_profile(profile_data: dict, user: User = Depends(require_auth)):
    """Update user profile"""
    allowed_fields = ["name", "phone", "location_enabled", "emergency_number"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if "phone" in update_data:
        # Validate phone number
        try:
            parsed_phone = phonenumbers.parse(update_data["phone"], None)
            if not phonenumbers.is_valid_number(parsed_phone):
                raise HTTPException(status_code=400, detail="Invalid phone number")
            update_data["phone"] = phonenumbers.format_number(parsed_phone, phonenumbers.PhoneNumberFormat.E164)
        except NumberParseException:
            raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    await db.users.update_one({"id": user.id}, {"$set": update_data})
    return {"message": "Profile updated"}

# Emergency contacts endpoints  
@api_router.get("/emergency-contacts")
async def get_emergency_contacts(user: User = Depends(require_auth)):
    """Get user's emergency contacts"""
    user_data = await db.users.find_one({"id": user.id})
    return user_data.get("emergency_contacts", [])

@api_router.post("/emergency-contacts")
async def add_emergency_contact(contact: EmergencyContactCreate, user: User = Depends(require_auth)):
    """Add emergency contact"""
    # Validate phone number
    try:
        parsed_phone = phonenumbers.parse(contact.phone, None)
        if not phonenumbers.is_valid_number(parsed_phone):
            raise HTTPException(status_code=400, detail="Invalid phone number")
        formatted_phone = phonenumbers.format_number(parsed_phone, phonenumbers.PhoneNumberFormat.E164)
    except NumberParseException:
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    new_contact = EmergencyContact(
        name=contact.name,
        phone=formatted_phone,
        relationship=contact.relationship,
        priority=contact.priority
    )
    
    await db.users.update_one(
        {"id": user.id},
        {"$push": {"emergency_contacts": new_contact.dict()}}
    )
    
    return {"message": "Emergency contact added", "contact_id": new_contact.id}

@api_router.delete("/emergency-contacts/{contact_id}")
async def delete_emergency_contact(contact_id: str, user: User = Depends(require_auth)):
    """Delete emergency contact"""
    await db.users.update_one(
        {"id": user.id},
        {"$pull": {"emergency_contacts": {"id": contact_id}}}
    )
    return {"message": "Emergency contact deleted"}

# Medical procedures endpoints
@api_router.get("/medical-procedures")
async def get_medical_procedures(category: Optional[str] = None):
    """Get medical procedures, optionally filtered by category"""
    # Return hardcoded procedures - in production this would be from database
    procedures = [
        {
            "id": "cpr-adult",
            "name": "RCP para Adultos",
            "description": "Reanimación cardiopulmonar para adultos que han perdido el conocimiento",
            "category": "cpr",
            "difficulty": "intermedio",
            "duration_minutes": 5,
            "images": [
                "https://images.unsplash.com/photo-1622115297822-a3798fdbe1f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxDUFJ8ZW58MHx8fHwxNzU5MDMwNjQ3fDA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1630964046403-8b745c1e3c69?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxDUFJ8ZW58MHx8fHwxNzU5MDMwNjQ3fDA&ixlib=rb-4.1.0&q=85"
            ],
            "steps": [
                {"step": 1, "title": "Verificar consciencia", "description": "Toca suavemente los hombros de la persona. Pregunta en voz alta si está bien. Observa si responde o se mueve", "duration": 10},
                {"step": 2, "title": "Pedir ayuda médica", "description": "Llama inmediatamente al servicio de emergencias. Si hay alguien cerca, pídele que llame mientras tú continúas", "duration": 30},
                {"step": 3, "title": "Posicionar las manos", "description": "Coloca el talón de una mano en el centro del pecho, entre los pezones. Pon la otra mano encima, entrelazando los dedos", "duration": 15},
                {"step": 4, "title": "Comprensiones torácicas", "description": "Presiona fuerte y rápido, hundiendo el pecho al menos 5 centímetros. Mantén un ritmo de 100 a 120 compresiones por minuto", "duration": 120},
                {"step": 5, "title": "Respiración de rescate", "description": "Inclina la cabeza hacia atrás, levanta la barbilla. Sella su boca con la tuya y da dos respiraciones lentas", "duration": 10},
                {"step": 6, "title": "Continuar ciclos", "description": "Alterna 30 compresiones con 2 respiraciones. No te detengas hasta que llegue ayuda médica profesional", "duration": 0}
            ]
        },
        {
            "id": "choking-adult",
            "name": "Atragantamiento en Adultos",
            "description": "Maniobra de Heimlich para adultos conscientes que se están atragantando",
            "category": "choking",
            "difficulty": "básico",
            "duration_minutes": 2,
            "images": [
                "https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxmaXJzdCUyMGFpZHxlbnwwfHx8fDE3NTkwMzA2NTN8MA&ixlib=rb-4.1.0&q=85"
            ],
            "steps": [
                {"step": 1, "title": "Reconocer el atragantamiento", "description": "Pregunta si se está atragantando. Busca señales como no poder hablar, toser débilmente o dificultad para respirar", "duration": 5},
                {"step": 2, "title": "Colocarse detrás", "description": "Párate detrás de la persona. Rodea su cintura con tus brazos manteniendo la calma", "duration": 5},
                {"step": 3, "title": "Formar el puño", "description": "Haz un puño con una mano. Coloca el lado del pulgar contra el abdomen, justo arriba del ombligo", "duration": 5},
                {"step": 4, "title": "Empujes abdominales", "description": "Agarra el puño con la otra mano. Realiza empujes rápidos y firmes hacia arriba y hacia adentro", "duration": 30},
                {"step": 5, "title": "Continuar hasta desalojar", "description": "Repite los empujes hasta que el objeto salga o la persona pierda el conocimiento. Mantén la calma", "duration": 0}
            ]
        },
        {
            "id": "burns-minor",
            "name": "Quemaduras Menores",
            "description": "Tratamiento para quemaduras leves y escaldaduras que no son graves",
            "category": "burns",
            "difficulty": "básico",
            "duration_minutes": 10,
            "images": [
                "https://images.unsplash.com/photo-1624638760852-8ede1666ab07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxmaXJzdCUyMGFpZHxlbnwwfHx8fDE3NTkwMzA2NTN8MA&ixlib=rb-4.1.0&q=85"
            ],
            "steps": [
                {"step": 1, "title": "Alejar del calor", "description": "Retira inmediatamente a la persona de la fuente de calor. Asegúrate de que esté en un lugar seguro", "duration": 5},
                {"step": 2, "title": "Enfriar la quemadura", "description": "Aplica agua fresca, no fría, sobre la quemadura durante 10 a 20 minutos. Esto aliviará el dolor", "duration": 600},
                {"step": 3, "title": "Retirar objetos", "description": "Quita cuidadosamente joyas y ropa suelta del área quemada antes de que se inflame", "duration": 30},
                {"step": 4, "title": "Proteger la herida", "description": "Cubre con una gasa estéril limpia. Nunca uses hielo, mantequilla o remedios caseros", "duration": 60},
                {"step": 5, "title": "Aliviar el dolor", "description": "Si es necesario, puedes dar medicamentos para el dolor que se vendan sin receta médica", "duration": 5}
            ]
        },
        {
            "id": "wounds-bleeding",
            "name": "Severe Bleeding",
            "description": "Control severe bleeding from wounds",
            "category": "wounds",
            "difficulty": "intermediate",
            "duration_minutes": 5,
            "images": [
                "https://images.pexels.com/photos/3760275/pexels-photo-3760275.jpeg"
            ],
            "steps": [
                {"step": 1, "title": "Protect Yourself", "description": "Wear gloves or use barrier between you and blood", "duration": 10},
                {"step": 2, "title": "Direct Pressure", "description": "Apply direct pressure to wound with clean cloth or gauze", "duration": 30},
                {"step": 3, "title": "Elevate if Possible", "description": "Raise injured area above heart level if safe to do so", "duration": 5},
                {"step": 4, "title": "Maintain Pressure", "description": "Keep applying pressure, add more bandages if blood soaks through", "duration": 180},
                {"step": 5, "title": "Seek Medical Help", "description": "Call emergency services for severe bleeding", "duration": 30}
            ]
        }
    ]
    
    if category:
        procedures = [p for p in procedures if p["category"] == category]
    
    return procedures

@api_router.get("/medical-procedures/{procedure_id}")
async def get_medical_procedure(procedure_id: str):
    """Get specific medical procedure details"""
    procedures = await get_medical_procedures()
    procedure = next((p for p in procedures if p["id"] == procedure_id), None)
    
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    
    return procedure

# Emergency/SOS endpoints
@api_router.post("/emergency/sos")
async def trigger_sos(sos_request: SOSRequest, user: User = Depends(require_auth)):
    """Trigger SOS emergency alert"""
    try:
        # Create emergency alert record
        emergency_alert = EmergencyAlert(
            user_id=user.id,
            emergency_type=sos_request.emergency_type,
            location=sos_request.location,
            message=sos_request.custom_message or f"Emergency alert from {user.name}"
        )
        
        # Save to database
        await db.emergency_alerts.insert_one(emergency_alert.dict())
        
        # Get user's emergency contacts
        user_data = await db.users.find_one({"id": user.id})
        emergency_contacts = user_data.get("emergency_contacts", [])
        
        # Format location for SMS
        location_text = ""
        if sos_request.location:
            location_text = f"\nLocation: {sos_request.location.latitude}, {sos_request.location.longitude}"
            if sos_request.location.address:
                location_text += f" ({sos_request.location.address})"
            # Add Google Maps link
            maps_link = f"https://maps.google.com/maps?q={sos_request.location.latitude},{sos_request.location.longitude}"
            location_text += f"\nView on map: {maps_link}"
        
        # Send SMS to emergency contacts
        contacts_notified = []
        if sns_client and emergency_contacts:
            sms_message = (
                f"🚨 EMERGENCY ALERT 🚨\n"
                f"From: {user.name}\n"
                f"Type: {sos_request.emergency_type.upper()}\n"
                f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"Message: {emergency_alert.message}"
                f"{location_text}\n\n"
                f"This is an automated emergency alert from Aidly."
            )
            
            # Sort contacts by priority and send SMS
            sorted_contacts = sorted(emergency_contacts, key=lambda x: x.get("priority", 1))
            
            for contact in sorted_contacts:
                try:
                    response = sns_client.publish(
                        PhoneNumber=contact["phone"],
                        Message=sms_message
                    )
                    contacts_notified.append(contact["id"])
                    logging.info(f"SMS sent to {contact['name']}: {response['MessageId']}")
                except Exception as e:
                    logging.error(f"Failed to send SMS to {contact['name']}: {e}")
        
        # Update alert with notified contacts
        await db.emergency_alerts.update_one(
            {"id": emergency_alert.id},
            {"$set": {"contacts_notified": contacts_notified}}
        )
        
        return {
            "message": "SOS alert triggered",
            "alert_id": emergency_alert.id,
            "contacts_notified": len(contacts_notified),
            "emergency_number": user.emergency_number or "911"
        }
    
    except Exception as e:
        logging.error(f"SOS error: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger SOS alert")

@api_router.get("/emergency/alerts")
async def get_emergency_alerts(user: User = Depends(require_auth)):
    """Get user's emergency alerts history"""
    alerts = await db.emergency_alerts.find(
        {"user_id": user.id}
    ).sort("created_at", -1).to_list(50)
    
    return [EmergencyAlert(**alert) for alert in alerts]

@api_router.post("/emergency/alerts/{alert_id}/resolve")
async def resolve_emergency_alert(alert_id: str, user: User = Depends(require_auth)):
    """Mark emergency alert as resolved"""
    result = await db.emergency_alerts.update_one(
        {"id": alert_id, "user_id": user.id},
        {
            "$set": {
                "status": "resolved",
                "resolved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert resolved"}

# Location services
@api_router.post("/location/reverse-geocode")
async def reverse_geocode(location: LocationData, user: User = Depends(require_auth)):
    """Convert coordinates to address"""
    try:
        location_info = geolocator.reverse(f"{location.latitude}, {location.longitude}")
        address = location_info.address if location_info else "Address not found"
        
        return {
            "address": address,
            "latitude": location.latitude,
            "longitude": location.longitude
        }
    except Exception as e:
        logging.error(f"Reverse geocoding error: {e}")
        return {
            "address": "Unable to determine address",
            "latitude": location.latitude,
            "longitude": location.longitude
        }

# Image generation endpoint
@api_router.post("/generate-image")
async def generate_medical_image(prompt: str, user: User = Depends(require_auth)):
    """Generate medical procedure image"""
    if not image_gen:
        raise HTTPException(status_code=503, detail="Image generation service not available")
    
    try:
        # Generate image with medical context
        medical_prompt = f"Medical emergency procedure illustration: {prompt}. Clean, educational, medical diagram style."
        
        images = await image_gen.generate_images(
            prompt=medical_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return {"image_base64": image_base64}
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
    
    except Exception as e:
        logging.error(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "connected",
            "sms": "available" if sns_client else "unavailable",
            "image_generation": "available" if image_gen else "unavailable"
        }
    }

@api_router.get("/")
async def root():
    return {"message": "Aidly Medical Emergency Assistant API"}

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
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
