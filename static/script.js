async function scanUrl() {
    const urlInput = document.getElementById("url-input").value;
    const qrUpload = document.getElementById("qr-upload").files[0];
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "Scanning...";
    resultDiv.className = "result";

    let urlToScan = urlInput;
    console.log("Manual URL input:", urlInput);

    // If a QR code image is uploaded, decode it
    if (qrUpload) {
        try {
            const fileUrl = URL.createObjectURL(qrUpload);
            console.log("Attempting to scan image:", fileUrl);

            // Create an image element to load the file
            const img = new Image();
            img.src = fileUrl;
            await new Promise((resolve) => (img.onload = resolve));

            // Scan the image with the new API
            const qrResult = await QrScanner.scanImage(img, { returnDetailedScanResult: true });
            console.log("QR Result:", qrResult);
            urlToScan = qrResult.data; // Use the new API's return value
            console.log("Decoded QR URL:", urlToScan);
        } catch (error) {
            resultDiv.innerHTML = "Error decoding QR code: " + error.message;
            resultDiv.className = "result error";
            console.error("QR Scanning Error:", error);
            return;
        }
    }

    // If no URL provided (manual or QR), show error
    if (!urlToScan) {
        resultDiv.innerHTML = "Please enter a URL or upload a QR code.";
        resultDiv.className = "result error";
        return;
    }

    // Send URL to Flask API
    try {
        console.log("Sending URL to API:", urlToScan);
        const response = await fetch("http://127.0.0.1:5000/scan", {
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
    }
}