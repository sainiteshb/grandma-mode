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

@app.post("/simplify")
async def simplify_page(request: ScreenshotRequest):
    print("📸 Receiving Screenshot Request...")

    # --- HACKATHON MOCK MODE ---
    # Set this to TRUE while you are coding/debugging.
    # Set this to FALSE only when you are ready to demo.
    USE_MOCK_DATA = True

    if USE_MOCK_DATA:
        print("⚠️ MOCK MODE: Returning fake data to save API credits.")
        return {
            "status": "success",
            "data": {
                "page_summary": "MOCK MODE - Wikipedia Test",
                "primary_actions": [
                    {
                        "label": "Search", 
                        "visual_clue": "search", 
                        "color": "blue"
                    },
                    {
                        "label": "Login", 
                        "visual_clue": "log in", 
                        "color": "gray"
                    },
                     {
                        "label": "Read", 
                        "visual_clue": "read", 
                        "color": "gray"
                    }
                ]
            }
        }
    if not model:
        return {
            "status": "error", 
            "message": "Server is running, but Gemini API Key is missing. Check terminal logs."
        }

    try:
        img = decode_image(request.image_data)
        
        prompt = """
You are an UI accessibility expert. Analyze this screenshot.
        Identify the 2-3 PRIMARY actions (Happy Path).
        
        For the "visual_clue", choose the MOST LIKELY text attribute in the HTML.
        - If it's a button with text, use that text.
        - If it's a Search Icon, use "Search" or "Find".
        - If it's a Login Icon, use "Login" or "Sign In".
        
        Return JSON format:
        {
            "page_summary": "Short description",
            "primary_actions": [
                { 
                  "label": "Search", 
                  "visual_clue": "search", 
                  "color": "gray" 
                }
            ]
        }
        """

        print("🤖 Sending to Gemini...")
        response = model.generate_content([prompt, img])
        response_json = json.loads(response.text)
        print("✅ Analysis Success!")
        
        return { "status": "success", "data": response_json }

    except Exception as e:
        print(f"❌ Processing Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/")
def health_check():
    return {"status": "Grandma Mode Brain is Alive", "api_key_present": bool(api_key)}