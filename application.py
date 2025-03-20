from flask import Flask, request, jsonify, send_from_directory
import joblib
import tldextract
import traceback

application = Flask(__name__, static_folder="static", template_folder="templates")  # Changed to 'application'

try:
    model = joblib.load("url_classifier.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

def extract_features(url):
    ext = tldextract.extract(url)
    return [
        len(url), url.count('-'), url.count('.'), url.count('/'),
        len(ext.domain), 1 if "https" in url else 0,
        sum(c.isdigit() for c in url), 1 if ext.subdomain else 0
    ]

@application.route('/')
def home():
    return send_from_directory(application.template_folder, "index1.html")

@application.route('/scan', methods=['POST'])
def scan_url():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    try:
        data = request.get_json()
        url = data.get("url", "")
        if not url:
            return jsonify({"error": "No URL provided"}), 400
        features = [extract_features(url)]
        print(f"Debug: Features for {url}: {features}")
        prediction = model.predict(features)[0]
        result = "Safe ✅" if prediction == 1 else "Fake ❌"
        return jsonify({"url": url, "status": result})
    except Exception as e:
        print(f"❌ Error in /scan: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=5000)  # Ensure it listens on all interfaces
