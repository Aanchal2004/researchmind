"""Quick smoke test for Gemini API.

Usage:
    1. Paste your key below where it says YOUR_KEY_HERE
       (or set RESEARCHMIND_LLM_GEMINI_API_KEY in .env — it auto-loads)
    2. Run: python scripts/verify_gemini.py
"""

import os
import sys

# ── Load .env so the key can come from there too ────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass  # python-dotenv not installed — key must be set manually below

# ── Key: edit this line OR set it in .env ───────────────────────────────────
API_KEY = os.getenv("RESEARCHMIND_LLM_GEMINI_API_KEY", "YOUR_KEY_HERE")
MODEL   = os.getenv("RESEARCHMIND_LLM_GEMINI_MODEL", "gemini-2.0-flash")
# ────────────────────────────────────────────────────────────────────────────

if not API_KEY or API_KEY == "YOUR_KEY_HERE":
    print("❌  No API key found.")
    print("    Either paste it into this script (line marked above)")
    print("    or add it to backend/.env as RESEARCHMIND_LLM_GEMINI_API_KEY=...")
    sys.exit(1)

print(f"🔑  Using model : {MODEL}")
print("⏳  Sending test prompt to Gemini …\n")

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    print("❌  google-genai not installed. Run: pip install google-genai")
    sys.exit(1)

client = genai.Client(api_key=API_KEY)

PROMPT = (
    "Return ONLY valid JSON — no markdown. "
    "JSON must have key 'answer' with a one-sentence explanation of "
    "why the sky is blue."
)

try:
    response = client.models.generate_content(
        model=MODEL,
        contents=PROMPT,
        config=genai_types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=256,
            response_mime_type="application/json",
        ),
    )
    print("✅  Gemini responded:")
    print(response.text)
    print("\n🎉  Gemini is working! Key is valid.")
except Exception as exc:
    print(f"❌  Gemini call failed: {exc}")
    sys.exit(1)
