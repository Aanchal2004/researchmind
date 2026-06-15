"""Quick smoke test for local Ollama connectivity."""
import httpx
import json

BASE_URL = "http://localhost:11434"
MODEL = "llama3"

print(f"Testing Ollama at {BASE_URL} with model '{MODEL}'...")

try:
    r = httpx.post(
        f"{BASE_URL}/api/chat",
        json={
            "model": MODEL,
            "messages": [
                {"role": "user", "content": "Name two famous AI papers in one sentence each. Reply as JSON: {\"papers\": [\"...\", \"...\"]}"}
            ],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.2},
        },
        timeout=120,
    )
    r.raise_for_status()
    data = r.json()
    content = data.get("message", {}).get("content", "")
    print("Status  :", r.status_code)
    print("Response:", content[:400])
    print()
    print("Ollama is working correctly.")
except Exception as exc:
    print(f"FAILED: {exc}")
