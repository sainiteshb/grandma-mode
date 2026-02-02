# 👵 Grandma Mode
> **Making the Internet Accessible for Everyone.**

**Grandma Mode** is an AI-powered Chrome Extension that simplifies complex websites for elderly and non-technical users. By using **Google Gemini 3 (Multimodal)**, it visually analyzes webpages in real-time and overlays a high-contrast, simplified interface with big buttons and Voice Control.

## 🚀 Key Features

* **🧠 AI-Powered Simplification:** Uses Gemini 3 Vision to identify the "Happy Path" (Search, Login, Cart) on any cluttered website.
* **🗣️ Voice Navigation:** Users can simply say *"Search"* or *"Login"* instead of struggling with small links.
* **⚡ Instant Interface:** Features a "Glassmorphism" UI with skeleton loading states for immediate feedback.
* **🎯 Robust "Fuzzy" Search:** A custom scoring engine ensures buttons are found even if the website updates its code or uses obscure IDs.

## 🛠️ Tech Stack

* **AI Model:** Google Gemini 1.5 Flash / Gemini 3.0 Preview (Multimodal Vision)
* **Backend:** Python (FastAPI), Docker
* **Frontend:** Chrome Extension (Manifest V3), JavaScript, CSS3 (Material Design)
* **Infrastructure:** Dockerized for portability

---

## ⚙️ Installation & Setup

### 1. Backend (The Brain)
The backend handles the image processing and communicates with the Gemini API.

**Option A: Run with Docker (Recommended)**
```bash
cd backend
docker build -t grandma-brain .
docker run -p 8000:8000 --env-file .env grandma-brain
```
**Option B: Run locally**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
