import os
import requests

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
API_URL = "https://router.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct"

if not HF_TOKEN:
    print("WARNING: HF_TOKEN is missing in .env. Skipping this test.")
    import sys
    sys.exit(0)

headers = {"Authorization": f"Bearer {HF_TOKEN}"}

print(f"Testing {API_URL}...")
try:
    resp = requests.post(API_URL, headers=headers, json={"inputs": "Hi"}, timeout=30)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text[:500]}")
except Exception as exc:
    print(f"ERROR: {exc}")
