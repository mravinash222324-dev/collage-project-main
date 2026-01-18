import requests
import os

# One key from main.py for testing
# One key from metadata or env
API_KEY = os.environ.get("GROQ_API_KEY", "")

url = "https://api.groq.com/openai/v1/models"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        models = response.json()['data']
        print("Available Groq Models:")
        for m in models:
            print(f"- {m['id']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Exception: {e}")
