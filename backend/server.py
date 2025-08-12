from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import json
import uuid
import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext

# AI service import
try:
    from .ai_service import ResumeAIService
except Exception:
    from ai_service import ResumeAIService

app = FastAPI(title="Google Docs 2.0 - Resume Builder")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
# Also load .env from this backend directory explicitly (helps when CWD is project root)
try:
    from pathlib import Path
    backend_env = Path(__file__).resolve().parent / ".env"
    if backend_env.exists():
        load_dotenv(backend_env)
except Exception:
    pass

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")

DB_NAME = os.getenv("DB_NAME")
print(f"Connecting to MongoDB: {MONGO_URL}")
print(f"Database name: {DB_NAME}")


client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Test database connection
try:
    # Ping the database
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    raise

# Collections
documents_collection = db.documents
versions_collection = db.versions
users_collection = db.users
labels_collection = db.labels

print("📁 Collections initialized")

# Ensure labels collection exists
try:
    # This will create the collection if it doesn't exist
    db.create_collection("labels")
    print("✅ Labels collection created/verified")
except Exception as e:
    print(f"ℹ️ Labels collection already exists: {e}")

# ===================== AI SERVICE INIT =====================
ai_service_instance = None
try:
    ai_service_instance = ResumeAIService()
    print("🤖 AI service initialized")
except Exception as e:
    print(f"❌ Failed to initialize AI service: {e}")

# Authentication helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    username = verify_token(token)
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = users_collection.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Pydantic models
class DocumentContent(BaseModel):
    text: str = ""
    
class DocumentSection(BaseModel):
    id: str
    title: str
    content: DocumentContent
    order: int

# Update the Document model to include label
class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    sections: List[DocumentSection] = Field(default_factory=list)
    label: Optional[str] = None  # Add this line
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class DocumentVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    version_number: int
    title: str
    sections: List[DocumentSection]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None

# Update CreateDocumentRequest to include label and sections
class CreateDocumentRequest(BaseModel):
    title: str
    label: Optional[str] = None
    sections: Optional[List[DocumentSection]] = None
    
class UpdateDocumentRequest(BaseModel):
    title: Optional[str] = None
    sections: Optional[List[DocumentSection]] = None
    label: Optional[str] = None  # Add this line
    
class UpdateSectionRequest(BaseModel):
    content: DocumentContent

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Label(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CreateLabelRequest(BaseModel):
    name: str
    color: str

class UpdateLabelRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

# ===== AI API MODELS =====
class AIChatRequest(BaseModel):
    message: str
    resume_data: Optional[Dict[str, Any]] = None


class AISectionRequest(BaseModel):
    section_content: str
    user_question: str
    resume_data: Optional[Dict[str, Any]] = None


class AIAtsRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: Optional[str] = None

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        del doc['_id']
    return doc

def get_default_sections():
    """Get default resume sections with professional formatting"""
    return [
        {
            "id": str(uuid.uuid4()),
            "title": "Personal Information",
            "content": {"text": "**YOUR NAME**\nYour Number | youremail@address.com | Location | Your Website"},
            "order": 1
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Skills",
            "content": {"text": "Languages: Python, Java, C++, JavaScript\nSkills: AWS, React, SQL, MongoDB, Node.js"},
            "order": 2
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Education",
            "content": {"text": "**Your School**, (Degree Name ex Bachelor of Science)                                        **Expected Graduation Date:** Month Year\n**Major:** (Ex: Computer Science), **Minor:** Certificate or Minor in, **GPA:** Out of 4.0\n**Relevant Coursework**: (Optional, only list a couple of the most relevant courses taken)"},
            "order": 3
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Experience",
            "content": {"text": "**MOST RECENT EMPLOYER**, Position Title                                                                                     Month Year - Present\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text (Check out our guide on how to write strong bullet points for technical resumes)\n• Text\n\n**PREVIOUS EMPLOYER**, Position Title                                                                                       Month Year - Month Year\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text"},
            "order": 4
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Projects",
            "content": {"text": "**PROJECT NAME**                                                                                                                           Month Year - Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest, including awards/accomplishments/outcomes achieved based on some bullet point format from experience)\n• Text\n\n**ANOTHER PROJECT NAME**                                                                                                      Month Year - Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest)\n• Text"},
            "order": 5
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Leadership & Community",
            "content": {"text": "**ORGANIZATION**, Position Title                                                                                                    Month Year - Month Year\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text"},
            "order": 6
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Awards & Honors",
            "content": {"text": "**ORGANIZATION**                                                                                                                           Month Year - Month Year\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text"},
            "order": 7
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Certifications",
            "content": {"text": "[Certification Name] | [Issuing Organization] | [Date Earned]\n[Certification ID or Credential Number]\n\n[Another Certification] | [Organization] | [Date]\n[Credential details]"},
            "order": 8
        }
    ]

@app.get("/")
async def root():
    return {"message": "Google Docs 2.0 - Resume Builder API"}

# ===================== AI ENDPOINTS =====================
@app.get("/api/ai/status")
async def get_ai_status():
    if not ai_service_instance:
        return {"available": False, "has_api_key": False, "model": "None", "current_job_description": False}
    return ai_service_instance.get_service_status()


@app.post("/api/ai/chat")
async def ai_chat(request: AIChatRequest, current_user: dict = Depends(get_current_user)):
    if not ai_service_instance:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    try:
        return ai_service_instance.chat_with_ai(request.message, request.resume_data, user_id=current_user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/section")
async def ai_section(request: AISectionRequest, current_user: dict = Depends(get_current_user)):
    if not ai_service_instance:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    try:
        return ai_service_instance.analyze_resume_section(request.section_content, request.user_question, request.resume_data, user_id=current_user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/ats")
async def ai_ats(request: AIAtsRequest, current_user: dict = Depends(get_current_user)):
    if not ai_service_instance:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    try:
        return ai_service_instance.generate_ats_advice(request.resume_data, request.job_description, user_id=current_user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    
    # Check if username already exists
    existing_user = users_collection.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    existing_email = users_collection.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user_data.username,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    # Insert user into database
    users_collection.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.username}, expires_delta=access_token_expires
    )
    
    # Return token and user info
    user_response = UserResponse(
        id=user_doc["id"],
        username=user_doc["username"],
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        created_at=user_doc["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login user"""
    
    # Find user by username
    user = users_collection.find_one({"username": user_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Return token and user info
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"]
    )

@app.post("/api/documents")
async def create_document(request: CreateDocumentRequest, current_user: dict = Depends(get_current_user)):
    """Create a new document"""
    print(f"🚀 CREATE DOCUMENT REQUEST:")
    print(f"   Title: {request.title}")
    print(f"   Label: {request.label}")
    print(f"   User ID: {current_user['id']}")
    
    try:
        # Handle label assignment - use provided label or default to "Master Resume"
        label_to_use = request.label
        
        if not label_to_use:
            print(f"🏷️ No label provided, looking for default 'Master Resume' label")
            # Find the "Master Resume" label for this user
            master_resume_label = labels_collection.find_one({
                "name": "Master Resume",
                "user_id": current_user["id"]
            })
            
            if master_resume_label:
                label_to_use = master_resume_label["id"]
                print(f"✅ Found Master Resume label: {label_to_use}")
            else:
                print(f"⚠️ No Master Resume label found, creating document without label")
        
        # Validate label if provided
        if label_to_use:
            print(f"🔍 Validating label: {label_to_use}")
            label = labels_collection.find_one({
                "id": label_to_use,
                "user_id": current_user["id"]
            })
            if not label:
                print(f"❌ Invalid label: {label_to_use}")
                raise HTTPException(status_code=400, detail="Invalid label")
            print(f"✅ Label validated: {label}")
        
        # Use provided sections or default sections
        sections = request.sections if request.sections else get_default_sections()
        
        document_data = {
            "id": str(uuid.uuid4()),
            "title": request.title,
            "sections": [section.dict() if hasattr(section, 'dict') else section for section in sections],
            "label": label_to_use,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        print(f"📝 Inserting document data: {document_data}")
        result = documents_collection.insert_one(document_data)
        print(f"✅ Document inserted with ObjectId: {result.inserted_id}")
        
        return serialize_doc(document_data)
    except Exception as e:
        print(f"❌ Error creating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents for the current user"""
    documents = list(documents_collection.find({"user_id": current_user["id"]}).sort("updated_at", -1))
    return [serialize_doc(doc) for doc in documents]

@app.get("/api/documents/{document_id}")
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific document"""
    document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return serialize_doc(document)

@app.put("/api/documents/{document_id}")
async def update_document(document_id: str, request: UpdateDocumentRequest, current_user: dict = Depends(get_current_user)):
    """Update a document"""
    print(f"🔄 UPDATE DOCUMENT REQUEST:")
    print(f"   Document ID: {document_id}")
    print(f"   Request data: {request.dict()}")
    print(f"   Label field: {request.label}")
    print(f"   Label is None: {request.label is None}")
    print(f"   User ID: {current_user['id']}")
    
    try:
        # Check if document exists and belongs to user
        document = documents_collection.find_one({
            "id": document_id,
            "user_id": current_user["id"]
        })
        
        if not document:
            print(f"❌ Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        print(f"✅ Document found: {document['title']}")
        
        # Validate label if provided (but allow None/null for removal)
        if request.label is not None and request.label:
            print(f"🔍 Validating label: {request.label}")
            label = labels_collection.find_one({
                "id": request.label,
                "user_id": current_user["id"]
            })
            if not label:
                print(f"❌ Invalid label: {request.label}")
                raise HTTPException(status_code=400, detail="Invalid label")
            print(f"✅ Label validated: {label['name']}")
        elif request.label is None:
            print(f"🗑️ Removing label (label is None)")
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow()}
        
        if request.title is not None:
            update_data["title"] = request.title
            print(f"📝 Updating title to: {request.title}")
        if request.sections is not None:
            update_data["sections"] = [section.dict() for section in request.sections]
            print(f"📝 Updating sections (count: {len(request.sections)})")
        if request.label is not None:
            if request.label:  # If label has a value, set it
                update_data["label"] = request.label
                print(f"🏷️ Setting label to: {request.label}")
            else:  # If label is None/null, set it to None explicitly
                update_data["label"] = None
                print(f"🗑️ Setting label to None (removing label)")
        
        print(f"📝 Final update data: {update_data}")
        
        # Build the update operation
        update_operation = {"$set": update_data}
        
        print(f"🔧 MongoDB update operation: {update_operation}")
        
        # Update document
        result = documents_collection.update_one(
            {"id": document_id, "user_id": current_user["id"]},
            update_operation
        )
        
        print(f"✅ Update result: {result.modified_count} document(s) modified")
        
        # Create version if sections were updated
        if request.sections is not None:
            # Get current version number
            current_version = versions_collection.count_documents({"document_id": document_id}) + 1
            
            version_data = {
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "version_number": current_version,
                "title": document["title"],
                "sections": [section.dict() for section in request.sections],
                "created_at": datetime.utcnow(),
                "description": f"Auto-saved version {current_version}"
            }
            
            versions_collection.insert_one(version_data)
            print(f"📚 Created version {current_version}")
        
        # Return updated document
        updated_document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
        print(f"📤 Returning updated document: {updated_document['title']}")
        print(f"📤 Updated document label: {updated_document.get('label', 'No label')}")
        
        return serialize_doc(updated_document)
    except Exception as e:
        print(f"❌ Error updating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/documents/{document_id}/sections/{section_id}")
async def update_section(document_id: str, section_id: str, request: UpdateSectionRequest, current_user: dict = Depends(get_current_user)):
    """Update a specific section of a document"""
    document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Find and update the specific section
    sections = document.get("sections", [])
    section_found = False
    
    for section in sections:
        if section["id"] == section_id:
            section["content"] = request.content.model_dump()
            section_found = True
            break
    
    if not section_found:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Update document with new sections
    documents_collection.update_one(
        {"id": document_id, "user_id": current_user["id"]},
        {
            "$set": {
                "sections": sections,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create new version
    updated_doc = documents_collection.find_one({"id": document_id})
    if updated_doc:
        # Get latest version number
        latest_version = versions_collection.find_one(
            {"document_id": document_id},
            sort=[("version_number", -1)]
        )
        new_version_number = (latest_version["version_number"] + 1) if latest_version else 1
        
        version = DocumentVersion(
            document_id=document_id,
            version_number=new_version_number,
            title=updated_doc["title"],
            sections=updated_doc["sections"],
            description=f"Section updated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        
        version_dict = version.model_dump()
        version_dict['created_at'] = version.created_at
        versions_collection.insert_one(version_dict)
    
    return serialize_doc(updated_doc)

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document"""
    document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete document
    documents_collection.delete_one({"id": document_id, "user_id": current_user["id"]})
    
    # Delete all versions
    versions_collection.delete_many({"document_id": document_id})
    
    return {"message": "Document deleted successfully"}

@app.get("/api/documents/{document_id}/versions")
async def get_document_versions(document_id: str, current_user: dict = Depends(get_current_user)):
    """Get all versions of a document"""
    # Verify document belongs to user
    document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    versions = list(versions_collection.find({"document_id": document_id}).sort("version_number", -1))
    return [serialize_doc(version) for version in versions]

@app.get("/api/documents/{document_id}/versions/{version_number}")
async def get_document_version(document_id: str, version_number: int, current_user: dict = Depends(get_current_user)):
    """Get a specific version of a document"""
    # Verify document belongs to user
    document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    version = versions_collection.find_one({"document_id": document_id, "version_number": version_number})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return serialize_doc(version)

@app.post("/api/documents/{document_id}/versions/{version_number}/restore")
async def restore_document_version(document_id: str, version_number: int, current_user: dict = Depends(get_current_user)):
    """Restore a document to a specific version"""
    # Verify document belongs to user
    document = documents_collection.find_one({"id": document_id, "user_id": current_user["id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get the version to restore
    version = versions_collection.find_one({"document_id": document_id, "version_number": version_number})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Update document with version data
    documents_collection.update_one(
        {"id": document_id, "user_id": current_user["id"]},
        {
            "$set": {
                "title": version["title"],
                "sections": version["sections"],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create new version from the restore
    latest_version = versions_collection.find_one(
        {"document_id": document_id},
        sort=[("version_number", -1)]
    )
    new_version_number = (latest_version["version_number"] + 1) if latest_version else 1
    
    restore_version = DocumentVersion(
        document_id=document_id,
        version_number=new_version_number,
        title=version["title"],
        sections=version["sections"],
        description=f"Restored from version {version_number} on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    
    version_dict = restore_version.model_dump()
    version_dict['created_at'] = restore_version.created_at
    versions_collection.insert_one(version_dict)
    
    updated_doc = documents_collection.find_one({"id": document_id})
    return serialize_doc(updated_doc)

# Label Management Endpoints
@app.post("/api/labels")
async def create_label(request: CreateLabelRequest, current_user: dict = Depends(get_current_user)):
    """Create a new label for the current user"""
    print(f"🚀 CREATE LABEL REQUEST START")
    print(f"   Raw request: {request}")
    print(f"   Request name: '{request.name}'")
    print(f"   Request color: '{request.color}'")
    print(f"   Current user: {current_user}")
    print(f"   Current user ID: '{current_user['id']}'")
    
    try:
        # Test database connection first
        print("📡 Testing database connection...")
        client.admin.command('ping')
        print("✅ Database ping successful")
        
        # Check if label with same name already exists for this user
        print(f"🔍 Checking for existing label with name: '{request.name}' for user: '{current_user['id']}'")
        
        existing_query = {
            "user_id": current_user["id"],
            "name": request.name
        }
        print(f"🔍 Query: {existing_query}")
        
        existing_label = labels_collection.find_one(existing_query)
        print(f"🔍 Existing label result: {existing_label}")
        
        if existing_label:
            print(f"⚠️ Label with name '{request.name}' already exists for user {current_user['id']}")
            raise HTTPException(status_code=400, detail="Label with this name already exists")
        
        # Create the label data
        label_id = str(uuid.uuid4())
        label_data = {
            "id": label_id,
            "name": request.name,
            "color": request.color,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow()
        }
        
        print(f"📝 Prepared label data:")
        print(f"   Label ID: {label_id}")
        print(f"   Name: '{label_data['name']}'")
        print(f"   Color: '{label_data['color']}'")
        print(f"   User ID: '{label_data['user_id']}'")
        print(f"   Created at: {label_data['created_at']}")
        print(f"   Full data: {label_data}")
        
        # Insert the label
        print(f"💾 Attempting to insert label into collection...")
        print(f"💾 Collection name: {labels_collection.name}")
        print(f"💾 Database name: {labels_collection.database.name}")
        
        result = labels_collection.insert_one(label_data)
        print(f"✅ Insert operation completed")
        print(f"✅ Inserted ID: {result.inserted_id}")
        print(f"✅ Acknowledged: {result.acknowledged}")
        
        # Verify the label was inserted by searching for it
        print(f"🔍 Verifying insert by searching for label ID: {label_id}")
        inserted_label = labels_collection.find_one({"id": label_id})
        print(f"🔍 Found inserted label: {inserted_label}")
        
        # Also verify by searching with user_id
        print(f"🔍 Verifying by searching for user labels...")
        user_labels = list(labels_collection.find({"user_id": current_user["id"]}))
        print(f"🔍 All user labels: {user_labels}")
        
        # Return the serialized label
        serialized = serialize_doc(label_data)
        print(f"📤 Returning serialized label: {serialized}")
        
        return serialized
        
    except HTTPException as he:
        print(f"⚠️ HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        print(f"❌ Unexpected error creating label: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/labels")
async def get_labels(current_user: dict = Depends(get_current_user)):
    """Get all labels for the current user"""
    print(f" GET LABELS REQUEST:")
    print(f"   User ID: {current_user['id']}")
    
    try:
        labels = list(labels_collection.find({"user_id": current_user["id"]}))
        print(f"🔍 Found {len(labels)} labels for user {current_user['id']}")
        print(f" Raw labels from DB: {labels}")
        
        serialized_labels = [serialize_doc(label) for label in labels]
        print(f"📤 Serialized labels being returned: {serialized_labels}")
        
        return serialized_labels
    except Exception as e:
        print(f"❌ Error getting labels: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/labels/{label_id}")
async def update_label(label_id: str, request: UpdateLabelRequest, current_user: dict = Depends(get_current_user)):
    """Update a label"""
    print(f"✏️ UPDATE LABEL REQUEST:")
    print(f"   Label ID: {label_id}")
    print(f"   Request data: {request.dict()}")
    print(f"   User ID: {current_user['id']}")
    
    try:
        # Check if label exists and belongs to user
        print(f"🔍 Checking if label exists: {label_id}")
        label = labels_collection.find_one({
            "id": label_id,
            "user_id": current_user["id"]
        })
        
        if not label:
            print(f"❌ Label not found: {label_id}")
            raise HTTPException(status_code=404, detail="Label not found")
        
        print(f"✅ Label found: {label}")
        
        # Check if new name conflicts with existing label
        if request.name:
            print(f"🔍 Checking for name conflict: {request.name}")
            existing_label = labels_collection.find_one({
                "user_id": current_user["id"],
                "name": request.name,
                "id": {"$ne": label_id}
            })
            
            if existing_label:
                print(f"⚠️ Name conflict found: {request.name}")
                raise HTTPException(status_code=400, detail="Label with this name already exists")
        
        # Update label
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.color is not None:
            update_data["color"] = request.color
        
        print(f"📝 Update data: {update_data}")
        
        if update_data:
            result = labels_collection.update_one(
                {"id": label_id, "user_id": current_user["id"]},
                {"$set": update_data}
            )
            print(f"✅ Update result: {result.modified_count} documents modified")
        
        # Return updated label
        updated_label = labels_collection.find_one({"id": label_id, "user_id": current_user["id"]})
        print(f"🔍 Updated label: {updated_label}")
        
        return serialize_doc(updated_label)
    except Exception as e:
        print(f"❌ Error updating label: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/labels/{label_id}")
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a label and remove it from all documents"""
    print(f"🗑️ DELETE LABEL REQUEST:")
    print(f"   Label ID: {label_id}")
    print(f"   User ID: {current_user['id']}")
    
    try:
        # Check if label exists and belongs to user
        print(f"🔍 Checking if label exists: {label_id}")
        label = labels_collection.find_one({
            "id": label_id,
            "user_id": current_user["id"]
        })
        
        if not label:
            print(f"❌ Label not found: {label_id}")
            raise HTTPException(status_code=404, detail="Label not found")
        
        print(f"✅ Label found: {label}")
        
        # Remove label from all documents that use it
        print(f"🔍 Removing label from documents...")
        result = documents_collection.update_many(
            {"user_id": current_user["id"], "label": label_id},
            {"$set": {"label": None}}
        )
        print(f"📄 Updated {result.modified_count} documents")
        
        # Delete the label
        print(f"🗑️ Deleting label from database...")
        delete_result = labels_collection.delete_one({"id": label_id, "user_id": current_user["id"]})
        print(f"✅ Deleted {delete_result.deleted_count} label")
        
        return {"message": "Label deleted successfully"}
    except Exception as e:
        print(f"❌ Error deleting label: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Add this test endpoint to verify the label system is working (around line 610)
@app.get("/api/labels/test")
async def test_labels_collection():
    """Test endpoint to verify labels collection is working"""
    print("🧪 TESTING LABELS COLLECTION")
    
    try:
        # Test basic database connection
        print("📡 Testing database connection...")
        client.admin.command('ping')
        print("✅ Database connection OK")
        
        # Test collection access
        print("📁 Testing labels collection access...")
        collection_names = db.list_collection_names()
        print(f"📋 Available collections: {collection_names}")
        
        # Test insert directly
        print("💾 Testing direct insert to labels collection...")
        test_label = {
            "id": "test-123",
            "name": "Test Label",
            "color": "#ff0000",
            "user_id": "test-user",
            "created_at": datetime.utcnow()
        }
        
        result = labels_collection.insert_one(test_label)
        print(f"✅ Test insert successful. ObjectId: {result.inserted_id}")
        
        # Verify the insert
        retrieved = labels_collection.find_one({"id": "test-123"})
        print(f"🔍 Retrieved test label: {retrieved}")
        
        # Clean up test data
        labels_collection.delete_one({"id": "test-123"})
        print("🧹 Cleaned up test data")
        
        return {"status": "success", "message": "Labels collection is working"}
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)