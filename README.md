# CardSync 🎴💬

CardSync is a modern, responsive, and serverless single-page web application designed for mobile and desktop browsers. It allows users to scan business cards using their phone's camera, extract phone numbers instantly, and initiate a WhatsApp conversation with a pre-configured, custom message template in one tap.

No sign-in, account creation, or backend database is required. Everything runs entirely client-side in the browser.

---

## 🌟 Key Features

* **📷 Dual Capture Modes**:
  * **Live Stream (Capture)**: Uses WebRTC to stream the camera feed with visual framing guidelines and a scanning animation.
  * **File Upload (Upload)**: Allows selecting existing images from your gallery/photo library or snapping a photo using the phone's native high-resolution camera.
* **🧠 Smart Phone Number Extraction**:
  * Runs client-side OCR using **Tesseract.js** in WebAssembly.
  * Uses a custom **context-aware scoring algorithm** to parse phone numbers and ignore false positives (like dates, zip codes, or serial numbers).
  * Automatically penalizes and filters out fax lines.
  * Prioritizes numbers near contact-related keywords (`Tel`, `Cell`, `Mob`, `Phone`, `WhatsApp`).
* **🌍 Country Code Awareness**:
  * Automatically detects international prefixes (e.g., `+91`, `+1`, `+44`).
  * Prepends a user-defined **Default Country Code** (e.g. `+91`) if the card only features a local number.
  * Automatically handles local formats (e.g., stripping the leading zero in UK/Australian mobile numbers).
  * Includes a visual dropdown picker for manual overrides before sending.
* **✍️ Saved Message Templates**:
  * Draft custom message templates directly in the app.
  * Saves configurations (default country code and message drafts) to `localStorage` so they persist across sessions.
* **🔒 100% Privacy Focused**:
  * No images or text are ever uploaded to a server. All OCR recognition is processed locally on your device.

---

## 🛠️ Tech Stack

* **Core**: HTML5, Vanilla JavaScript (ES6)
* **Styling**: Vanilla CSS (Responsive design, dark theme, glassmorphism, keyframe animations)
* **Icons**: [Lucide Icons](https://lucide.dev/)
* **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (loaded via CDN)
* **Redirection**: Official WhatsApp click-to-chat API (`wa.me`)

---

## 🚀 How to Run Locally

Since the app consists of static files (HTML, CSS, and JS), you can serve it using any lightweight local web server.

### Option A: Python (Built-in)
Navigate to the project folder and run:
```bash
python -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

### Option B: Node.js (http-server)
Run via npx:
```bash
npx http-server -p 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## ⚡ Deployment

### Deploying to Vercel
Because CardSync is a static frontend application, it is perfectly suited for platforms like Vercel or Netlify with zero configuration:

1. Push this folder to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com).
3. Import the repository and click **Deploy**.
4. Vercel will automatically host the application and set up continuous deployments (every push to `main` will redeploy the site).
