import os
import requests

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
MODELS_TO_TEST = [
    "https://router.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
    "https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
    "https://router.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    "https://router.huggingface.co/models/google/gemma-2-9b-it",
    "https://router.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
]

if not HF_TOKEN:
    print("WARNING: HF_TOKEN is missing in .env. Skipping this test.")
    import sys
    sys.exit(0)

headers = {"Authorization": f"Bearer {HF_TOKEN}"}


def test_model(url: str) -> bool:
    print(f"Testing: {url}")
    try:
        resp = requests.post(
            url,
            headers=headers,
            json={"inputs": "Say hello!", "parameters": {"max_new_tokens": 10}},
            timeout=30,
        )
        if resp.status_code == 200:
            print(f"SUCCESS: {url}")
            return True
        print(f"FAILED ({resp.status_code}): {resp.text[:300]}")
    except Exception as exc:
        print(f"ERROR: {exc}")
    return False


print("Searching for a working model...")
for model_url in MODELS_TO_TEST:
    if test_model(model_url):
        break
print("Done.")
