qr-code-scanner/
├── static/
│   ├── script.js       # Your existing JS file
│   ├── style.css      # Your existing CSS file
│   └── qr-scanner.min.js  # Downloaded from CDN
├── templates/
│   └── index.html     # Your existing HTML file
├── .ebignore          # To exclude unnecessary files
├── application.py     # Renamed from app.py (Elastic Beanstalk convention)
├── requirements.txt   # Python dependencies
└── .elasticbeanstalk/
    └── config.yml     # Optional EB config


Flask==2.3.3
joblib==1.3.2
tldextract==5.1.2

pip freeze > requirements.txt


Step 2: Set Up AWS Elastic Beanstalk
Prerequisites
AWS Account: Sign up at aws.amazon.com (free tier available, but requires a credit card).
AWS CLI: Install from aws.amazon.com/cli/ and configure with:
bash

Collapse

Wrap

Copy
aws configure
Enter your Access Key, Secret Key, region (e.g., us-east-1), and output format (json).
EB CLI: Install with:
bash

Collapse

Wrap

Copy
pip install awsebcli
2.1 Initialize Elastic Beanstalk
In your project directory (qr-code-scanner/):

bash

Collapse

Wrap

Copy
eb init -p python-3.9 qr-scanner-app --region us-east-1
-p python-3.9: Python 3.9 platform (adjust if needed).
qr-scanner-app: Your app name.
us-east-1: Choose a region close to you or your hackathon audience.
Follow prompts to select or create an AWS credential profile.

2.2 Create an Environment
bash

Collapse

Wrap

Copy
eb create qr-scanner-env
qr-scanner-env: Environment name.
This sets up a single EC2 instance, load balancer, and auto-scaling group.
Takes ~5-10 minutes. Watch the output for completion.
2.3 Deploy Your App
bash

Collapse

Wrap

Copy
eb deploy
Uploads your code to Elastic Beanstalk.
Installs dependencies from requirements.txt.
Starts your Flask app.
2.4 Verify Deployment
bash

Collapse

Wrap

Copy
eb open
Opens your app in a browser (e.g., http://qr-scanner-env.us-east-1.elasticbeanstalk.com).
Test with manual URL input (https://go0gle.com) or upload test_qr.png.
Step 3: Configure for Production
3.1 Adjust Security Groups
In the AWS Console (console.aws.amazon.com):
Go to EC2 → Security Groups.
Find the group tied to your EB environment (e.g., awseb-e-...).
Add inbound rule: HTTP, Port 80, Source 0.0.0.0/0 (public access).
Elastic Beanstalk uses port 80 by default; your app’s 5000 is proxied internally.
3.2 Handle File Uploads
Your app accepts QR image uploads. Elastic Beanstalk’s instances are ephemeral, so:

Modify script.js to send the image as a base64 string instead of a file:
javascript

Collapse

Wrap

Copy
if (qrUpload) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        const qrResult = await QrScanner.scanImage(base64Image, { returnDetailedScanResult: true });
        urlToScan = qrResult.data;
        sendToApi(urlToScan);
    };
    reader.readAsDataURL(qrUpload);
}

async function sendToApi(url) {
    const response = await fetch("/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url })
    });
    // Handle response...
}
Update application.py to expect only URLs (no file handling needed).
3.3 Optional: Custom Domain (Hackathon Bonus)
Use AWS Route 53 to map a domain (e.g., qrscanner.yourdomain.com) to your EB URL.
In Route 53:
Create an A record → Alias to your EB environment URL.
Step 4: Test and Debug
Check Logs:
bash

Collapse

Wrap

Copy
eb logs
Look for errors like missing url_classifier.pkl or dependency issues.
Local Testing: Before redeploying, test locally:
bash

Collapse

Wrap

Copy
python application.py
Visit http://localhost:5000.
Common Fixes:
Model not found? Ensure url_classifier.pkl is in the root and readable.
QR scan fails? Verify qr-scanner.min.js is served correctly (/static/qr-scanner.min.js).
Step 5: Hackathon Presentation Tips
Demo: Show scanning test_qr.png and a manual URL (https://g00gle.com).
Highlight: “Deployed on AWS in minutes with Elastic Beanstalk—scalable and ready for real-world use!”
URL: Share your EB URL (e.g., qr-scanner-env.us-east-1.elasticbeanstalk.com).
Next Steps (Post-Hackathon)
S3 for Model Storage: Store url_classifier.pkl in S3 and download it at runtime to avoid bundling it.
CI/CD: Integrate GitHub Actions to auto-deploy on push (ask me for a workflow!).
HTTPS: Enable SSL via AWS Certificate Manager for security.
