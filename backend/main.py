import os
import base64
import json
import io
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

# 1. Explicitly load the .env file
# We print the result to see if it actually found the file.
load_status = load_dotenv()
print(f"📂 Loading .env file status: {load_status}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Safe Configuration (No Crashing)
api_key = os.getenv("GOOGLE_API_KEY")
model = None

if not api_key:
    print("⚠️ WARNING: GOOGLE_API_KEY is missing!")
    print("   Make sure you have a file named '.env' in the backend folder.")
    print("   The file should contain: GOOGLE_API_KEY=your_key_here")
else:
    print(f"🔑 API Key found! (Starts with: {api_key[:4]}...)")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview", 
            generation_config={"response_mime_type": "application/json"}
        )
        print("✅ Gemini Model Configured Successfully.")
    except Exception as e:
        print(f"❌ Error configuring Gemini: {e}")

class ScreenshotRequest(BaseModel):
    image_data: str

def decode_image(base64_string):
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    image_bytes = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(image_bytes))

# In backend/main.py

@app.post("/simplify")
async def simplify_page(request: ScreenshotRequest):
    print("📸 Receiving Screenshot Request...")

    # --- MOCK DATA (Updated for robustness) ---
    USE_MOCK_DATA = True# <--- REMEMBER TO SET THIS TO FALSE TO USE REAL AI

    if USE_MOCK_DATA:
        print("⚠️ USING MOCK DATA (Switch to False for Real AI)")
        return {
            "status": "success",
            "data": {
                "page_summary": "Wikipedia Homepage",
                "primary_actions": [
                    {
                        "label": "Search", 
                        # We now provide MANY synonyms to ensure a hit
                        "keywords": ["search", "search-input", "searchInput", "go", "find", "vector-search-box-input", "searchform"], 
                        "icon_name": "search",
                        "type": "input" # Explicitly tell JS this is a text box
                    },
                    {
                        "label": "Login", 
                        "keywords": ["log in", "sign in", "user-login", "pt-login", "account", "auth", "user"], 
                        "icon_name": "login",
                        "type": "clickable"
                    }
                ]
            }
        }
    # -------------------------------------------

    if not model:
        return {"status": "error", "message": "API Key missing."}

    try:
        img = decode_image(request.image_data)
        
        # --- THE "CUTTING EDGE" PROMPT ---
        prompt = """
        You are a Senior SDET (Software Development Engineer in Test). 
        Your job is to reverse-engineer this UI screenshot into robust DOM selectors.

        Task: Identify the 3 most critical actions for a non-technical user (The "Happy Path").

        For each action, provide a "Robust Locator Strategy":
        1. "label": The visible text (e.g. "Sign In").
        2. "type": Is it an "input" (typing) or "clickable" (button/link)?
        3. "icon_name": A Google Material Icon name (e.g. "search", "person", "shopping_cart").
        4. "keywords": A technical array of at least 8 strings. Include:
           - The visible text (e.g. "Sign In")
           - Lowercase variations (e.g. "sign in")
           - Likely HTML IDs (e.g. "login-btn", "nav-link-accountList")
           - Likely ARIA labels (e.g. "Submit Search")
           - Common synonyms (e.g. if text is "Go", keyword includes "search", "submit")

        Return pure JSON:
        {
            "page_summary": "Amazon Product Page",
            "primary_actions": [
                { 
                  "label": "Add to Cart",
                  "type": "clickable",
                  "icon_name": "cart",
                  "keywords": ["add to cart", "add-to-cart-button", "submit.add-to-cart", "a-button-input", "purchase", "buy"] 
                }
            ]
        }
        """

        print("🤖 Sending to Gemini 3 (Engineer Mode)...")
        response = model.generate_content([prompt, img])
        response_json = json.loads(response.text)
        return { "status": "success", "data": response_json }

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/")
def health_check():
    return {"status": "Grandma Mode Brain is Alive", "api_key_present": bool(api_key)}