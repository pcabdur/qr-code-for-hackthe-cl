let qrScanner = null;
let isCameraActive = false;

async function scanUrl() {
    const urlInput = document.getElementById("url-input").value.trim();
    const qrUpload = document.getElementById("qr-upload").files[0];
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "Scanning...";
    resultDiv.className = "result";

    let urlToScan = urlInput;

    if (qrUpload) {
        try {
            const fileUrl = URL.createObjectURL(qrUpload);
            console.log("Attempting to scan image:", fileUrl);
            const img = new Image();
            img.src = fileUrl;
            await new Promise((resolve) => (img.onload = resolve));
            const qrResult = await QrScanner.scanImage(img, { returnDetailedScanResult: true });
            urlToScan = qrResult.data;
            console.log("Decoded QR URL:", urlToScan);
        } catch (error) {
            resultDiv.innerHTML = "Error decoding QR code: " + error.message;
            resultDiv.className = "result error";
            console.error("QR Scanning Error:", error);
            return;
        }
    }

    if (!urlToScan && !isCameraActive) {
        resultDiv.innerHTML = "Please enter a URL, upload a QR code, or start the camera.";
        resultDiv.className = "result error";
        return;
    }

    if (urlToScan) {
        await sendToApi(urlToScan, resultDiv);
    }
}

function toggleCamera() {
    const videoElement = document.getElementById("qr-video");
    const startButton = document.getElementById("start-camera");
    const resultDiv = document.getElementById("result");

    if (!isCameraActive) {
        console.log("Starting camera...");
        videoElement.classList.add("active");
        startButton.textContent = "Stop Camera";
        resultDiv.innerHTML = "Point your camera at a QR code...";
        resultDiv.className = "result";

        if (typeof QrScanner === "undefined") {
            resultDiv.innerHTML = "Error: QrScanner library not loaded.";
            resultDiv.className = "result error";
            console.error("QrScanner is not defined. Check if qr-scanner.min.js is loaded.");
            return;
        }

        qrScanner = new QrScanner(videoElement, (result) => {
            const urlToScan = result.data;
            console.log("Camera decoded QR URL:", urlToScan);
            sendToApi(urlToScan, resultDiv);
        }, { returnDetailedScanResult: true });

        qrScanner.start()
            .then(() => {
                console.log("Camera started successfully.");
                isCameraActive = true;
            })
            .catch((error) => {
                resultDiv.innerHTML = "Error starting camera: " + error.message;
                resultDiv.className = "result error";
                console.error("Camera Start Error:", error);
                stopCamera();
            });
    } else {
        stopCamera();
    }
}

function stopCamera() {
    const videoElement = document.getElementById("qr-video");
    const startButton = document.getElementById("start-camera");
    console.log("Stopping camera...");
    if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
        qrScanner = null;
    }
    videoElement.classList.remove("active");
    startButton.textContent = "Start Camera";
    isCameraActive = false;
}

async function sendToApi(urlToScan, resultDiv) {
    try {
        console.log("Sending URL to API:", urlToScan);
        const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
            ? "http://127.0.0.1:5000/scan" 
            : "/scan";
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urlToScan })
        });

        const data = await response.json();

        if (response.ok) {
            resultDiv.innerHTML = `URL: ${data.url}<br>Status: ${data.status}`;
            resultDiv.className = data.status.includes("Safe") ? "result safe" : "result fake";
        } else {
            resultDiv.innerHTML = `Error: ${data.error} - ${data.details || "Unknown error"}`;
            resultDiv.className = "result error";
        }
    } catch (error) {
        resultDiv.innerHTML = "Error contacting server: " + error.message;
        resultDiv.className = "result error";
        console.error("API Error:", error);
    }
}