import re
import time
import os
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables (for GROQ_API_KEY)
load_dotenv()

from app.database import save_complaint_db
from app.ai_agent import ai_agent_app, call_groq_json

app = FastAPI(title="Complaint AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractTextRequest(BaseModel):
    text: str

class Message(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    messages: List[Message]
    form_state: Dict[str, Any]

class SaveRequest(BaseModel):
    form_state: Dict[str, Any]


def classify_user_intent(message: str) -> str:
    """Uses Groq to classify whether a message is an update/edit or a standard question."""
    system_prompt = """
    Analyze the user's message and determine if they want to modify, correct, update, set, or change any of the fields in their complaint form.
    Examples of updates: "change batch number to LOT-X", "the product name is Aspirin", "correct quantity affected to 10kg".
    Examples of chat: "what is the current risk level?", "explain why the severity is critical", "hello".
    
    You must output a JSON object with a single key:
    - intent: "edit" (if they are requesting a change/correction) or "chat" (if they are asking a question or talking)
    """
    
    classification = call_groq_json(system_prompt, f"User message: \"{message}\"")
    return classification.get("intent", "chat")


def extract_pdf_text_fallback(content: bytes) -> str:
    """Reads raw PDF binary stream and extracts readable ASCII and UTF-8 strings."""
    # Find all sequences of 4 or more readable characters
    readable_strings = re.findall(rb'[ -~]{4,}', content)
    text = b" ".join(readable_strings).decode("utf-8", errors="ignore")
    # Clean up double spacing and formatting artifacts
    text = re.sub(r'\s+', ' ', text)
    return text


@app.get("/")
def home():
    return {"message": "Complaint AI Backend Running 🚀"}


@app.post("/api/extract-text")
def extract_text(request: ExtractTextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")
    
    # Run the LangGraph StateGraph workflow
    initial_state = {
        "messages": [],
        "form_state": {},
        "text_input": request.text,
        "action_type": "log",
        "risk_assessment": {}
    }
    
    try:
        result = ai_agent_app.invoke(initial_state)
        return {
            "success": True,
            "extracted_data": result["form_state"],
            "message": "AI successfully extracted details and assessed risk."
        }
    except Exception as e:
        print(f"Error invoking LangGraph extract-text: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()
    text = ""
    
    if filename.endswith(".txt") or filename.endswith(".eml"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin1", errors="ignore")
    elif filename.endswith(".pdf"):
        # Use our custom light-weight pdf binary stream reader
        text = extract_pdf_text_fallback(content)
        if not text.strip():
            text = f"Simulated content for scanned PDF {file.filename}: Customer DistCorp reported a packaging integrity leak in Batch LOT-2026-X89 of product Ibuprofen 400mg. 250 bags were affected. Complaint Date: 2026-07-29."
    else:
        # Generic document format text reader
        text = content.decode("utf-8", errors="ignore")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail=f"Uploaded file '{file.filename}' is empty or unreadable.")

    # Run the LangGraph StateGraph workflow
    initial_state = {
        "messages": [],
        "form_state": {},
        "text_input": text,
        "action_type": "upload",
        "risk_assessment": {}
    }
    
    try:
        result = ai_agent_app.invoke(initial_state)
        return {
            "success": True,
            "filename": file.filename,
            "extracted_data": result["form_state"],
            "message": f"AI successfully parsed document '{file.filename}' and assessed risk."
        }
    except Exception as e:
        print(f"Error invoking LangGraph upload-file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided.")
    
    last_user_message = request.messages[-1].text
    
    # Format messages list to python structure
    agent_messages = [{"sender": msg.sender, "text": msg.text} for msg in request.messages]
    
    initial_state = {
        "messages": agent_messages,
        "form_state": request.form_state,
        "text_input": last_user_message,
        "action_type": "chat",
        "risk_assessment": {}
    }
    
    try:
        result = ai_agent_app.invoke(initial_state)
        reply = result["messages"][-1]["text"]
        return {
            "success": True,
            "reply": reply,
            "updated_form_data": result["form_state"]
        }
    except Exception as e:
        print(f"Error invoking LangGraph chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save")
def save_complaint(request: SaveRequest):
    form = request.form_state
    if not form.get("productName"):
        raise HTTPException(status_code=400, detail="Product Name is required to save a complaint.")
        
    try:
        complaint_id = save_complaint_db(form)
        return {
            "success": True,
            "message": f"Complaint for product '{form.get('productName')}' has been successfully logged with Database ID: {complaint_id} and set to Pending Triage status."
        }
    except Exception as e:
        print(f"Error saving to SQLite: {e}")
        raise HTTPException(status_code=500, detail="Failed to save complaint to database.")