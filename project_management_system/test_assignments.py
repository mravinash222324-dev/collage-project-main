import requests

# Test assignment list endpoint
token = input("Enter your teacher access token: ")

headers = {"Authorization": f"Bearer {token}"}

print("\n--- Testing /assignments/list/ ---")
resp = requests.get("http://127.0.0.1:8000/assignments/list/", headers=headers)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.json()}")

print("\n--- Testing /teacher/groups/ ---")
resp2 = requests.get("http://127.0.0.1:8000/teacher/groups/", headers=headers)
print(f"Status: {resp2.status_code}")
print(f"Response: {resp2.json()}")
