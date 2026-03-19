from huggingface_hub import InferenceClient
import os

MODEL = "HuggingFaceH4/zephyr-7b-beta"
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()

if not HF_TOKEN:
    print("WARNING: HF_TOKEN is missing in .env. Skipping this test.")
    import sys
    sys.exit(0)

print(f"Testing {MODEL} with InferenceClient...")
client = InferenceClient(model=MODEL, token=HF_TOKEN)

try:
    output = client.chat_completion(
        messages=[{"role": "user", "content": "Say hello in one sentence."}],
        max_tokens=40,
    )
    print("SUCCESS")
    print(output.choices[0].message.content)
except Exception as exc:
    print(f"ERROR: {exc}")
