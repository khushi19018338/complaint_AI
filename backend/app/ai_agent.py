import os
import json
from typing import TypedDict, List, Dict, Any
from groq import Groq
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END

# Load env variables
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

# Initialize Groq client
client = Groq(api_key=api_key)

# We use the highly capable Llama 3 model on Groq
LLM_MODEL = "llama-3.3-70b-versatile"

class AgentState(TypedDict):
    messages: List[Dict[str, str]]
    form_state: Dict[str, Any]
    text_input: str
    action_type: str  # "log" | "edit" | "upload" | "chat"
    risk_assessment: Dict[str, Any]

def call_groq_json(system_prompt: str, user_prompt: str) -> dict:
    """Helper to call Groq Chat Completion with JSON mode enabled."""
    if not api_key:
        print("WARNING: GROQ_API_KEY is not set. Returning empty mockup dictionary.")
        return {}
        
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=LLM_MODEL,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = chat_completion.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error calling Groq JSON Completion: {e}")
        return {}

def call_groq_text(messages_history: list) -> str:
    """Helper to call Groq Chat Completion for standard chatbot conversation."""
    if not api_key:
        return "GROQ API Key is missing. Please add it to your environment variables."
        
    try:
        chat_completion = client.chat.completions.create(
            messages=messages_history,
            model=LLM_MODEL,
            temperature=0.5
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq Text Completion: {e}")
        return "I apologize, but I encountered an error communicating with the Groq AI service. Please try again."


# =====================================================================
# LANGGRAPH NODE FUNCTIONS
# =====================================================================

def extraction_node(state: AgentState) -> dict:
    """AI Tool 1 & 3: Extracts complaint schema from raw text prompt/document."""
    system_prompt = """
    You are an expert AI Quality Assurance Assistant.
    Your task is to analyze the user's raw complaint text (from email, portal log, or document text) and extract the structured values matching the JSON schema below.
    If a field is not explicitly mentioned or cannot be inferred, return an empty string "" for it.
    
    You must output a JSON object with the exact keys:
    - complaintSource: (e.g. Email, Portal, Call, Letter)
    - customerName: (name of client or distributor reporting the issue)
    - productName: (name of medicine/product)
    - productStrength: (potency, strength, or grade, e.g. 500mg, 10%)
    - batchNumber: (lot/batch identifier)
    - manufacturingDate: (in YYYY-MM-DD or standard format)
    - expiryDate: (in YYYY-MM-DD or standard format)
    - quantityAffected: (numerical quantity of units or weight)
    - complaintType: (category of issue: Chemical Contamination, Packaging Defect, Sub-potent, etc.)
    - complaintDate: (date the issue was reported in YYYY-MM-DD)
    - detailedDescription: (a clear, descriptive summary of the quality issue reported)
    """
    
    user_prompt = f"Complaint Text:\n\"\"\"\n{state['text_input']}\n\"\"\""
    
    extracted_data = call_groq_json(system_prompt, user_prompt)
    
    # Merge defaults for missing keys
    keys = [
        "complaintSource", "customerName", "productName", "productStrength",
        "batchNumber", "manufacturingDate", "expiryDate", "quantityAffected",
        "complaintType", "complaintDate", "detailedDescription"
    ]
    for key in keys:
        if key not in extracted_data:
            extracted_data[key] = ""
            
    # Set fallback if description is empty
    if not extracted_data["detailedDescription"]:
        extracted_data["detailedDescription"] = state["text_input"][:500]
        
    return {
        "form_state": extracted_data
    }

def edit_node(state: AgentState) -> dict:
    """AI Tool 2: Merges chat-based updates/corrections into the existing complaint state."""
    system_prompt = """
    You are an expert Quality Assurance Assistant.
    Your task is to take the existing complaint JSON object, apply the user's update instruction or correction, and return the modified JSON object.
    You must preserve all unmodified fields exactly as they are.
    
    Output a JSON object containing the modified form fields. You must output the exact JSON structure matching the input fields:
    - complaintSource
    - customerName
    - productName
    - productStrength
    - batchNumber
    - manufacturingDate
    - expiryDate
    - quantityAffected
    - complaintType
    - complaintDate
    - detailedDescription
    """
    
    user_prompt = f"""
    Current JSON:
    {json.dumps(state['form_state'], indent=2)}
    
    User Update Request:
    "{state['text_input']}"
    """
    
    updated_data = call_groq_json(system_prompt, user_prompt)
    
    # Ensure all original keys are preserved if not updated by Groq
    merged = {**state['form_state']}
    for k, v in updated_data.items():
        if k in merged and v != "":
            merged[k] = v
            
    return {
        "form_state": merged
    }

def risk_assessment_node(state: AgentState) -> dict:
    """AI Tool 1 & 2: Recalculates risk parameters (Severity, Priority, Justification)."""
    system_prompt = """
    You are a Quality Risk Assessor in a pharmaceutical / medical manufacturing facility.
    Your task is to review the current complaint details and perform a formal quality risk assessment.
    
    You must output a JSON object containing:
    - initialSeverity: Must be one of ["Critical", "Major", "Minor"]
      - "Critical": Life-threatening issues, contamination of sterile vials, systemic failures, product recalls.
      - "Major": Sub-potency, major packaging integrity leaks, incorrect label strength but non-lethal.
      - "Minor": Superficial print defects, cosmetic scratches, small outer carton issues.
    - priority: Must be one of ["High", "Medium", "Low"]
      - "High" for Critical severity or large affected quantities (>100kg/1000 units).
      - "Medium" for Major severity or moderate quantities.
      - "Low" for Minor severity or small affected volumes.
    - riskJustification: A detailed 2-3 sentence paragraph explaining your risk reasoning based on chemical safety, patient risk, and regulatory standards.
    """
    
    user_prompt = f"""
    Complaint Form Details:
    {json.dumps(state['form_state'], indent=2)}
    """
    
    assessment = call_groq_json(system_prompt, user_prompt)
    
    # Validate structure
    severity = assessment.get("initialSeverity", "Major")
    if severity not in ["Critical", "Major", "Minor"]:
        severity = "Major"
        
    priority = assessment.get("priority", "Medium")
    if priority not in ["High", "Medium", "Low"]:
        priority = "Medium"
        
    justification = assessment.get("riskJustification", "Risk assessment performed based on the reported product quality deviation and quantity affected.")

    # Update form state
    updated_form = {**state['form_state']}
    updated_form["initialSeverity"] = severity
    updated_form["priority"] = priority
    updated_form["riskJustification"] = justification

    return {
        "form_state": updated_form,
        "risk_assessment": {
            "initialSeverity": severity,
            "priority": priority,
            "riskJustification": justification
        }
    }

def chat_node(state: AgentState) -> dict:
    """AI Chat Assistant Node: Converses about the complaint with full context and updates form dynamically."""
    # Step 1: Attempt to extract any updated or new fields from the user's message
    system_extract = """
    You are an expert AI Quality Assurance Assistant.
    Analyze the user's new message and extract any complaint details or updates to form fields.
    You must output a JSON object with keys ONLY for fields explicitly mentioned or updated in the message.
    If no fields are mentioned or updated, return an empty JSON object {}.
    
    Potential keys to extract:
    - complaintSource: (the channel of complaint, e.g. Email, Portal, Call)
    - customerName: (name of the client, pharmacy, or distributor reporting the issue)
    - productName: (name of medicine/product)
    - productStrength: (potency, strength, or grade, e.g. 500mg, 10%)
    - batchNumber: (lot/batch identifier)
    - manufacturingDate: (in YYYY-MM-DD or standard format)
    - expiryDate: (in YYYY-MM-DD or standard format)
    - quantityAffected: (numerical quantity of units or weight)
    - complaintType: (category of issue: Chemical Contamination, Packaging Defect, Sub-potent, etc.)
    - complaintDate: (date the issue was reported in YYYY-MM-DD)
    - detailedDescription: (a descriptive summary of the quality issue reported)
    """
    
    last_message = state["text_input"]
    extracted_updates = call_groq_json(system_extract, f"User Message: \"{last_message}\"")
    
    # Merge any non-empty extracted values into the current form state
    updated_form = {**state['form_state']}
    has_updates = False
    
    for k, v in extracted_updates.items():
        # Ensure we only merge keys that belong in the complaint form
        if k in [
            "complaintSource", "customerName", "productName", "productStrength",
            "batchNumber", "manufacturingDate", "expiryDate", "quantityAffected",
            "complaintType", "complaintDate", "detailedDescription"
        ]:
            if v is not None and str(v).strip() != "":
                updated_form[k] = str(v)
                has_updates = True
                
    # If there were field updates, recalculate the risk assessment
    if has_updates:
        system_risk = """
        Review the updated complaint details and perform a quality risk assessment. Output JSON with:
        - initialSeverity: "Critical" | "Major" | "Minor"
        - priority: "High" | "Medium" | "Low"
        - riskJustification: A detailed 2-3 sentence paragraph explaining your risk reasoning.
        """
        assessment = call_groq_json(system_risk, json.dumps(updated_form))
        if "initialSeverity" in assessment:
            updated_form["initialSeverity"] = assessment["initialSeverity"]
        if "priority" in assessment:
            updated_form["priority"] = assessment["priority"]
        if "riskJustification" in assessment:
            updated_form["riskJustification"] = assessment["riskJustification"]

    # Step 2: Generate the chatbot conversation response
    system_chat = f"""
    You are a helpful AI Quality Assurance Intake Assistant.
    Your role is to guide the user in logging and verifying customer complaints.
    Here is the current complaint form state for context:
    {json.dumps(updated_form, indent=2)}
    
    Respond to the user's last message. If they provided new information that updated the form, confirm that you have updated the fields on the left.
    Keep your response helpful, concise, and professional. Use markdown formatting.
    """
    
    system_messages = [{"role": "system", "content": system_chat}]
    for msg in state['messages']:
        role = "assistant" if msg['sender'] == "assistant" else "user"
        system_messages.append({"role": role, "content": msg['text']})
        
    reply = call_groq_text(system_messages)
    
    return {
        "form_state": updated_form,
        "messages": state['messages'] + [{"sender": "assistant", "text": reply}]
    }


# =====================================================================
# LANGGRAPH STATE GRAPH COMPILATION
# =====================================================================

workflow = StateGraph(AgentState)

# Add Node definitions
workflow.add_node("extraction", extraction_node)
workflow.add_node("edit", edit_node)
workflow.add_node("risk_assessment", risk_assessment_node)
workflow.add_node("chat", chat_node)

# Conditional Entry Router
def route_entry(state: AgentState):
    action = state.get("action_type", "chat")
    if action in ["log", "upload"]:
        return "extraction"
    elif action == "edit":
        return "edit"
    else:
        return "chat"

workflow.set_conditional_entry_point(
    route_entry,
    {
        "extraction": "extraction",
        "edit": "edit",
        "chat": "chat"
    }
)

# Connect edges
workflow.add_edge("extraction", "risk_assessment")
workflow.add_edge("edit", "risk_assessment")
workflow.add_edge("risk_assessment", END)
workflow.add_edge("chat", END)

# Compile LangGraph app
ai_agent_app = workflow.compile()
