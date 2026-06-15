"""Quick smoke test for Gemini API connectivity.
Run from the backend folder: python scripts/test_gemini.py
"""
import sys
import os

# Load .env so we pick up the key without setting env vars manually
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k, v)

api_key = os.environ.get("RESEARCHMIND_LLM_GEMINI_API_KEY", "")
model   = os.environ.get("RESEARCHMIND_LLM_GEMINI_MODEL", "gemini-2.0-flash")

if not api_key:
    print("ERROR: RESEARCHMIND_LLM_GEMINI_API_KEY not set in .env")
    sys.exit(1)

print(f"Using model : {model}")
print(f"Key prefix  : {api_key[:8]}...")
print()

from google import genai
from google.genai import types

client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model=model,
        contents="Name three landmark papers in deep learning in one sentence each.",
        config=types.GenerateContentConfig(
            max_output_tokens=200,
            temperature=0.2,
        ),
    )
    print("=== Gemini response ===")
    print(response.text)
    print()
    print("✓ Gemini API is working correctly.")
except Exception as exc:
    print(f"✗ Gemini API call failed: {exc}")
    sys.exit(1)
