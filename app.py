from flask import Flask, request, jsonify
import joblib
import tldextract
import traceback

app = Flask(__name__)

# Load the trained model
try:
    model = joblib.load("url_classifier.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Feature extraction function (must match training features)
def extract_features(url):
    ext = tldextract.extract(url)
    return [
        len(url),                       # 1: URL length
        url.count('-'),                 # 2: Hyphen count
        url.count('.'),                 # 3: Dot count
        url.count('/'),                 # 4: Slash count
        len(ext.domain),                # 5: Domain length
        1 if "https" in url else 0,     # 6: HTTPS presence
        sum(c.isdigit() for c in url),  # 7: Digit count
        1 if ext.subdomain else 0       # 8: Subdomain presence
    ]

@app.route('/')
def home():
    return "QR Code Scanner API is running!"

@app.route('/scan', methods=['POST'])
def scan_url():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json()
        url = data.get("url", "")
        if not url:
            return jsonify({"error": "No URL provided"}), 400

        # Extract features and predict
        features = [extract_features(url)]
        print(f"Debug: Features for {url}: {features}")  # Debug output
        prediction = model.predict(features)[0]
        result = "Safe ✅" if prediction == 1 else "Fake ❌"
        return jsonify({"url": url, "status": result})
    except Exception as e:
        print(f"❌ Error in /scan: {str(e)}")
        print(traceback.format_exc())  # Full stack trace
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)