import requests
import time

TTS_ENDPOINT = "http://127.0.0.1:8001/generate-voice-get"

voices_to_test = [
    {"name": "hannah", "text": "This is Hannah, your Viva examiner."},
    {"name": "troy", "text": "This is Troy, the Boss AI."}
]

print("Verifying Specific Voices...\n")

for item in voices_to_test:
    voice = item['name']
    text = item['text']
    
    print(f"Testing Voice: {voice}...")
    try:
        # Construct URL with query params
        url = f"{TTS_ENDPOINT}?text={text}&voice={voice}"
        print(f"🔗 Requesting: {url}")
        
        response = requests.get(url, timeout=60)
        
        if response.status_code == 200:
            filename = f"verify_{voice}.wav"
            with open(filename, "wb") as f:
                f.write(response.content)
            print(f"✅ Success! Saved to {filename}\n")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}\n")
            
    except Exception as e:
        print(f"⚠️ Exception: {e}\n")
    
    time.sleep(1)

print("Verification Complete.")
