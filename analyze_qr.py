import qrcode
import cv2
import requests
from PIL import Image

# Step 1: Generate a QR code with a test URL
test_url = "https://g00gle.com"  # Change this to any URL you want to test
qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data(test_url)
qr.make(fit=True)
img = qr.make_image(fill="black", back_color="white")
img.save("test_qr.png")
print(f"✅ QR code generated with URL: {test_url}")

# Step 2: Decode the QR code (simulating a scan)
detector = cv2.QRCodeDetector()
qr_image = cv2.imread("test_qr.png")
url, _, _ = detector.detectAndDecode(qr_image)
if url:
    print(f"✅ Decoded URL from QR code: {url}")
else:
    print("❌ Failed to decode QR code")
    exit()

# Step 3: Send the URL to the Flask API
api_url = "http://127.0.0.1:5000/scan"
payload = {"url": url}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(api_url, json=payload, headers=headers)
    response.raise_for_status()  # Raise an error for bad responses
    result = response.json()
    print(f"✅ API Response: URL: {result['url']}, Status: {result['status']}")
except requests.exceptions.RequestException as e:
    print(f"❌ Error contacting API: {e}")
