import requests
import time

def test_tts(text="Hello verify"):
    url = "http://127.0.0.1:8001/generate-voice"
    print(f"Connecting to {url} with text: '{text}'")
    
    start_time = time.time()
    try:
        # POST request
        response = requests.post(url, json={"text": text, "voice": "hannah"}, stream=True, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        
        if response.status_code == 200:
            content = response.content
            print(f"Success! Received {len(content)} bytes.")
            print(f"First 4 bytes: {content[:4]}") # Should be RIFF
            print(f"Time taken: {time.time() - start_time:.2f}s")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_tts("This is a test of the specific POST endpoint for Viva voice.")
