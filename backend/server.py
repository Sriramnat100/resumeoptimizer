from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import json
import uuid

app = FastAPI(title="Google Docs 2.0 - Resume Builder")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "resume_builder")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
documents_collection = db.documents
versions_collection = db.versions

# Pydantic models
class DocumentContent(BaseModel):
    text: str = ""
    
class DocumentSection(BaseModel):
    id: str
    title: str
    content: DocumentContent
    order: int

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    sections: List[DocumentSection] = Field(default_factory=list)
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

class CreateDocumentRequest(BaseModel):
    title: str
    
class UpdateDocumentRequest(BaseModel):
    title: Optional[str] = None
    sections: Optional[List[DocumentSection]] = None
    
class UpdateSectionRequest(BaseModel):
    content: DocumentContent

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
            "content": {"text": "YOUR NAME\nYour Number | youremail@address.com | Location | Your Website"},
            "order": 1
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Skills",
            "content": {"text": "• Python (Intermediate)\n• JavaScript (Native)\n• React (Advanced)\n• Node.js (Intermediate)\n• MongoDB (Beginner)"},
            "order": 2
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Education",
            "content": {"text": "Your School, (Degree Name ex Bachelor of Science)                    (Anticipated graduation date) Month\nYear\nMajor:        Certificate or Minor in\nGPA: (only write out if is decent and between 3.25 or 3.5+)\n\nRelevant Coursework: (Optional, only list a couple of the most relevant courses taken)"},
            "order": 3
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Experience",
            "content": {"text": "MOST RECENT EMPLOYER, City, State (Achievement)                    Month Year - Present\nPosition Title\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text (Check out our guide on how to write strong bullet points for technical resumes)\n• Text\n\nPREVIOUS EMPLOYER, City, State (Achievement)                    Month Year - Month Year\nPosition Title\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text"},
            "order": 4
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Projects",
            "content": {"text": "PROJECT NAME                                                        Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest, including awards/accomplishments/outcomes achieved based on some bullet point format from experience)\n• Text\n\nANOTHER PROJECT NAME                                                Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest)\n• Text"},
            "order": 5
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Leadership & Community",
            "content": {"text": "ORGANIZATION                                                        Month Year - Month Year\nPosition Title\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text"},
            "order": 6
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Awards & Honors",
            "content": {"text": "ORGANIZATION                                                        Month Year - Month Year\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text"},
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

@app.post("/api/documents")
async def create_document(request: CreateDocumentRequest):
    """Create a new document with default resume sections"""
    
    # Get default resume sections
    default_sections = get_default_sections()
    
    document = Document(
        title=request.title,
        sections=default_sections
    )
    
    # Save document
    doc_dict = document.model_dump()
    doc_dict['created_at'] = document.created_at
    doc_dict['updated_at'] = document.updated_at
    
    documents_collection.insert_one(doc_dict)
    
    # Create initial version
    version = DocumentVersion(
        document_id=document.id,
        version_number=1,
        title=document.title,
        sections=document.sections,
        description="Initial version"
    )
    
    version_dict = version.model_dump()
    version_dict['created_at'] = version.created_at
    versions_collection.insert_one(version_dict)
    
    return serialize_doc(doc_dict)

@app.get("/api/documents")
async def get_documents():
    """Get all documents"""
    documents = list(documents_collection.find().sort("updated_at", -1))
    return [serialize_doc(doc) for doc in documents]

@app.get("/api/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document"""
    document = documents_collection.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return serialize_doc(document)

@app.put("/api/documents/{document_id}")
async def update_document(document_id: str, request: UpdateDocumentRequest):
    """Update a document"""
    document = documents_collection.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if request.title:
        update_data["title"] = request.title
    
    if request.sections:
        update_data["sections"] = [section.model_dump() for section in request.sections]
    
    documents_collection.update_one(
        {"id": document_id},
        {"$set": update_data}
    )
    
    # Create new version if sections were updated
    if request.sections:
        # Get current version number
        latest_version = versions_collection.find_one(
            {"document_id": document_id},
            sort=[("version_number", -1)]
        )
        next_version_number = (latest_version["version_number"] + 1) if latest_version else 1
        
        version = DocumentVersion(
            document_id=document_id,
            version_number=next_version_number,
            title=request.title or document["title"],
            sections=request.sections,
            description=f"Version {next_version_number}"
        )
        
        version_dict = version.model_dump()
        version_dict['created_at'] = version.created_at
        versions_collection.insert_one(version_dict)
    
    updated_doc = documents_collection.find_one({"id": document_id})
    return serialize_doc(updated_doc)

@app.put("/api/documents/{document_id}/sections/{section_id}")
async def update_section(document_id: str, section_id: str, request: UpdateSectionRequest):
    """Update a specific section of a document"""
    document = documents_collection.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update the specific section
    sections = document.get("sections", [])
    section_found = False
    
    for i, section in enumerate(sections):
        if section["id"] == section_id:
            sections[i]["content"] = request.content.model_dump()
            section_found = True
            break
    
    if not section_found:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Update document
    documents_collection.update_one(
        {"id": document_id},
        {"$set": {"sections": sections, "updated_at": datetime.utcnow()}}
    )
    
    # Create new version for section update
    latest_version = versions_collection.find_one(
        {"document_id": document_id},
        sort=[("version_number", -1)]
    )
    next_version_number = (latest_version["version_number"] + 1) if latest_version else 1
    
    version = DocumentVersion(
        document_id=document_id,
        version_number=next_version_number,
        title=document["title"],
        sections=sections,
        description=f"Updated section - Version {next_version_number}"
    )
    
    version_dict = version.model_dump()
    version_dict['created_at'] = version.created_at
    versions_collection.insert_one(version_dict)
    
    updated_doc = documents_collection.find_one({"id": document_id})
    return serialize_doc(updated_doc)

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and all its versions"""
    document = documents_collection.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete document and all versions
    documents_collection.delete_one({"id": document_id})
    versions_collection.delete_many({"document_id": document_id})
    
    return {"message": "Document deleted successfully"}

@app.get("/api/documents/{document_id}/versions")
async def get_document_versions(document_id: str):
    """Get all versions of a document"""
    document = documents_collection.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    versions = list(versions_collection.find(
        {"document_id": document_id}
    ).sort("version_number", -1))
    
    return [serialize_doc(version) for version in versions]

@app.get("/api/documents/{document_id}/versions/{version_number}")
async def get_document_version(document_id: str, version_number: int):
    """Get a specific version of a document"""
    version = versions_collection.find_one({
        "document_id": document_id,
        "version_number": version_number
    })
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return serialize_doc(version)

@app.post("/api/documents/{document_id}/versions/{version_number}/restore")
async def restore_document_version(document_id: str, version_number: int):
    """Restore a document to a specific version"""
    # Get the version to restore
    version = versions_collection.find_one({
        "document_id": document_id,
        "version_number": version_number
    })
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Update the current document with the version data
    documents_collection.update_one(
        {"id": document_id},
        {"$set": {
            "title": version["title"],
            "sections": version["sections"],
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Create a new version for the restore
    latest_version = versions_collection.find_one(
        {"document_id": document_id},
        sort=[("version_number", -1)]
    )
    next_version_number = (latest_version["version_number"] + 1) if latest_version else 1
    
    new_version = DocumentVersion(
        document_id=document_id,
        version_number=next_version_number,
        title=version["title"],
        sections=version["sections"],
        description=f"Restored from version {version_number}"
    )
    
    version_dict = new_version.model_dump()
    version_dict['created_at'] = new_version.created_at
    versions_collection.insert_one(version_dict)
    
    updated_doc = documents_collection.find_one({"id": document_id})
    return serialize_doc(updated_doc)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)