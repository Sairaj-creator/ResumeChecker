import os
import requests

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

if not HF_TOKEN:
    print("WARNING: HF_TOKEN is missing in .env. Skipping this test.")
    import sys
    sys.exit(0)

print("Connecting to Hugging Face...")

try:
    response = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json={"inputs": "Are you working?"},
        timeout=30,
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as exc:
    print(f"ERROR: {exc}")
