import google.generativeai as genai
import base64

API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=API_KEY)

def generate_image(prompt):
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash-image")

        print("Generating image...")

        # Direct image generation call
        response = model.generate_content(
            prompt,
            # NO response_mime_type — not supported for image output
        )

        # Extract the Base64 image from response parts
        image_data = None
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data.data:
                image_data = part.inline_data.data
                break

        if not image_data:
            print("No image returned from the model.")
            return

        # Decode and save
        img_bytes = base64.b64decode(image_data)
        file_path = "generated_image.png"
        with open(file_path, "wb") as f:
            f.write(img_bytes)

        print("Image generated successfully!")
        print("Saved as:", file_path)

    except Exception as e:
        print("Error:", e)


# Test
generate_image("A super futuristic cyberpunk city at night with neon lights")


#api_key = "AIzaSyCq88KexrXCjaxZqrijIQzLD8k9dpkf-II"
