import os
import requests

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
MODELS = [
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "mistralai/Mistral-Nemo-Instruct-2407",
    "microsoft/Phi-3.5-mini-instruct",
    "HuggingFaceH4/zephyr-7b-beta",
]

if not HF_TOKEN:
    print("WARNING: HF_TOKEN is missing in .env. Skipping this test.")
    import sys
    sys.exit(0)

headers = {"Authorization": f"Bearer {HF_TOKEN}"}

print("Starting model scan...")
for model in MODELS:
    url = f"https://router.huggingface.co/models/{model}"
    try:
        response = requests.post(url, headers=headers, json={"inputs": "Hi"}, timeout=30)
        print(f"{model}: {response.status_code}")
        if response.status_code == 200:
            print(f"FOUND WORKING MODEL: {model}")
            break
    except Exception as exc:
        print(f"{model} error: {exc}")
print("Done.")
