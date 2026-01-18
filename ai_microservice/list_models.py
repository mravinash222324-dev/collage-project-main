import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
keys = os.getenv("GEMINI_API_KEY", "").split(",")
api_key = keys[0].strip() if keys else None
genai.configure(api_key=api_key)

import json
models = []
print("Listing available models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        models.append(m.name)

with open("valid_models.json", "w") as f:
    json.dump(models, f, indent=2)
print("Saved models to valid_models.json")
