
import requests
import json

base_url = "http://127.0.0.1:8000/alumni/search/"
query = "autonomous vehicle"

print(f"Searching for: '{query}'...")
try:
    response = requests.get(base_url, params={'q': query})
    
    if response.status_code == 200:
        results = response.json()
        print(f"Found {len(results)} results.")
        for p in results:
            print(f"- {p['title']} (Score details internal/hidden)")
    else:
        print(f"Error: {response.status_code} - {response.text}")

except Exception as e:
    print(f"Connection failed: {e}")
