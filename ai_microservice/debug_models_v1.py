import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Try pool
    import json
    pool = os.getenv("GEMINI_KEY_POOL", "[]")
    try:
        keys = json.loads(pool)
        if keys: api_key = keys[0]
    except: pass

if not api_key:
    print("No API Key found")
    exit(1)

print(f"Using Key: {api_key[:5]}...")

client = genai.Client(api_key=api_key)

print("Listing models...")
try:
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")

print("\nTrying generation with 'gemini-2.0-flash':")
try:
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='Hello'
    )
    print("Success 2.0!")
except Exception as e:
    print(f"Error 2.0: {e}")

print("\nTrying generation with 'gemini-flash-latest':")
try:
    response = client.models.generate_content(
        model='gemini-flash-latest',
        contents='Hello'
    )
    print("Success Flash Latest!")
except Exception as e:
    print(f"Error Flash Latest: {e}")
