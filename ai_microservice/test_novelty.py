import requests
import json

def test_novelty_analysis():
    url = "http://127.0.0.1:8001/analyze-project-novelty"
    
    # 1. Define the "Archive" of previous projects
    previous_projects = [
        {
            "title": "Smart Library System 2023",
            "abstract": "A web-based library management system using QR codes for book checkout and a React frontend. Includes fine calculation and email notifications."
        },
        {
            "title": "Uber for Taxis",
            "abstract
            ": "A mobile app connecting riders with taxi drivers using GPS. Features real-time tracking, payment integration, and driver ratings."
        }
    ]

    # 2. Test Case A: The "Lazy Remix" (Clone)
    print("\n--- TEST CASE A: Lazy Remix (Clone) ---")
    payload_a = {
        "proposal_title": "Automated Book Lending App",
        "proposal_abstract": "An app to manage library books. Users scan QR codes to borrow books. It sends emails for late returns. Built with React.",
        "previous_projects": previous_projects
    }
    try:
        response = requests.post(url, json=payload_a)
        print(f"Status Code: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

    # 3. Test Case B: The "Innovation" (New Idea)
    print("\n--- TEST CASE B: Innovation (New Idea) ---")
    payload_b = {
        "proposal_title": "AI Music Composer",
        "proposal_abstract": "A deep learning model that generates original piano music based on user mood. Uses LSTM networks and MIDI output.",
        "previous_projects": previous_projects
    }
    try:
        response = requests.post(url, json=payload_b)
        print(f"Status Code: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_novelty_analysis()
