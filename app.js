// Common Country Codes list
const BASE_COUNTRY_CODES = [
    { code: "1", name: "United States / Canada (+1)" },
    { code: "91", name: "India (+91)" },
    { code: "44", name: "United Kingdom (+44)" },
    { code: "61", name: "Australia (+61)" },
    { code: "86", name: "China (+86)" },
    { code: "49", name: "Germany (+49)" },
    { code: "33", name: "France (+33)" },
    { code: "81", name: "Japan (+81)" },
    { code: "55", name: "Brazil (+55)" },
    { code: "27", name: "South Africa (+27)" },
    { code: "7", name: "Russia / Kazakhstan (+7)" },
    { code: "971", name: "United Arab Emirates (+971)" },
    { code: "65", name: "Singapore (+65)" },
    { code: "64", name: "New Zealand (+64)" },
    { code: "62", name: "Indonesia (+62)" },
    { code: "60", name: "Malaysia (+60)" },
    { code: "966", name: "Saudi Arabia (+966)" },
    { code: "52", name: "Mexico (+52)" },
    { code: "39", name: "Italy (+39)" },
    { code: "34", name: "Spain (+34)" },
    { code: "31", name: "Netherlands (+31)" },
    { code: "41", name: "Switzerland (+41)" },
    { code: "46", name: "Sweden (+46)" }
];

// App State
let activeTab = 'camera';
let videoStream = null;
let currentWorker = null;

// Settings (loaded from localStorage or defaults)
const settings = {
    defaultCountryCode: localStorage.getItem('cc_default_country_code') || '+91',
    defaultMessageTemplate: localStorage.getItem('cc_default_message') || "Hi! It was great meeting you today. Let's keep in touch!"
};

// DOM Elements
const tabCamera = document.getElementById('tabCamera');
const tabUpload = document.getElementById('tabUpload');
const cameraViewContainer = document.getElementById('cameraViewContainer');
const uploadViewContainer = document.getElementById('uploadViewContainer');
const video = document.getElementById('video');
const videoError = document.getElementById('videoError');
const captureBtn = document.getElementById('captureBtn');
const cameraControls = document.getElementById('cameraControls');
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');

const processingSection = document.getElementById('processingSection');
const scannerSection = document.getElementById('scannerSection');
const previewCanvas = document.getElementById('previewCanvas');
const cancelOcrBtn = document.getElementById('cancelOcrBtn');

const ocrStatusText = document.getElementById('ocrStatusText');
const ocrProgressPercent = document.getElementById('ocrProgressPercent');
const ocrProgressBar = document.getElementById('ocrProgressBar');

const resultsSection = document.getElementById('resultsSection');
const countrySelect = document.getElementById('countrySelect');
const phoneNumberInput = document.getElementById('phoneNumber');
const whatsappMessageInput = document.getElementById('whatsappMessage');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const extractedRawText = document.getElementById('extractedRawText');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const defaultCountryCodeInput = document.getElementById('defaultCountryCode');
const defaultMessageTemplateInput = document.getElementById('defaultMessageTemplate');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// Initialize App
function init() {
    populateCountryDropdown();
    setupEventListeners();
    loadSettingsInputs();
    
    // Start camera stream on init since it's the active tab
    startCamera();
}

// Populate Country Selector Dropdown
function populateCountryDropdown() {
    countrySelect.innerHTML = '';
    
    // Ensure the default country code is present in the list
    const codeList = [...BASE_COUNTRY_CODES];
    const defaultExists = codeList.some(item => item.code === settings.defaultCountryCode);
    if (!defaultExists && settings.defaultCountryCode.trim() !== '') {
        codeList.unshift({
            code: settings.defaultCountryCode.trim(),
            name: `Custom (+${settings.defaultCountryCode.trim()})`
        });
    }

    codeList.forEach(cc => {
        const option = document.createElement('option');
        option.value = cc.code;
        option.textContent = cc.name;
        if (cc.code === settings.defaultCountryCode) {
            option.selected = true;
        }
        countrySelect.appendChild(option);
    });
}

// Load current settings into Modal inputs
function loadSettingsInputs() {
    defaultCountryCodeInput.value = settings.defaultCountryCode;
    defaultMessageTemplateInput.value = settings.defaultMessageTemplate;
}

// Set up Event Listeners
function setupEventListeners() {
    // Tab toggles
    tabCamera.addEventListener('click', () => switchTab('camera'));
    tabUpload.addEventListener('click', () => switchTab('upload'));

    // Camera Capture
    captureBtn.addEventListener('click', captureCardImage);

    // File Upload Handlers
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Cancel OCR
    cancelOcrBtn.addEventListener('click', cancelOcr);

    // Send WhatsApp Action
    sendBtn.addEventListener('click', sendWhatsAppMessage);

    // Scan New Card (Reset)
    resetBtn.addEventListener('click', resetScanner);

    // Settings Modal toggles
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Close settings modal when clicking outside the card
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });
}

// Switch Tabs between Live Camera and File Upload
function switchTab(tab) {
    if (tab === activeTab) return;
    activeTab = tab;

    if (tab === 'camera') {
        tabCamera.classList.add('active');
        tabUpload.classList.remove('active');
        cameraViewContainer.classList.remove('hidden');
        cameraControls.classList.remove('hidden');
        uploadViewContainer.classList.add('hidden');
        startCamera();
    } else {
        tabCamera.classList.remove('active');
        tabUpload.classList.add('active');
        cameraViewContainer.classList.add('hidden');
        cameraControls.classList.add('hidden');
        uploadViewContainer.classList.remove('hidden');
        stopCamera();
    }
}

// Camera Operations
async function startCamera() {
    stopCamera(); // Clean up existing stream
    videoError.classList.add('hidden');
    video.classList.remove('hidden');

    try {
        const constraints = {
            video: {
                facingMode: 'environment', // Rear camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = videoStream;
    } catch (err) {
        console.error("Error accessing camera: ", err);
        video.classList.add('hidden');
        videoError.classList.remove('hidden');
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

// Capture Image from Live Video Feed
function captureCardImage() {
    if (!videoStream) return;

    const ctx = previewCanvas.getContext('2d');
    // Match dimensions to video's actual resolution
    previewCanvas.width = video.videoWidth;
    previewCanvas.height = video.videoHeight;
    
    // Draw current frame from video onto canvas
    ctx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
    
    stopCamera();
    
    // Transition to processing screen
    scannerSection.classList.add('hidden');
    processingSection.classList.remove('hidden');
    
    runOcr();
}

// Handle File Selection/Upload
function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const ctx = previewCanvas.getContext('2d');
            previewCanvas.width = img.width;
            previewCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Transition to processing screen
            scannerSection.classList.add('hidden');
            processingSection.classList.remove('hidden');
            
            runOcr();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// OCR Processing via Tesseract.js
async function runOcr() {
    updateProgress(0, 'Initializing OCR Engine...');
    
    try {
        // Create worker
        currentWorker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    updateProgress(m.progress, 'Scanning text...');
                } else if (m.status === 'loading tesseract core') {
                    updateProgress(0.1, 'Loading core files...');
                } else if (m.status === 'initializing api') {
                    updateProgress(0.2, 'Initializing core components...');
                }
            }
        });

        // Run OCR
        const { data: { text } } = await currentWorker.recognize(previewCanvas);
        await currentWorker.terminate();
        currentWorker = null;

        // Process extracted text
        handleOcrSuccess(text);

    } catch (err) {
        console.error("OCR Error: ", err);
        updateProgress(0, 'Error scanning card. Please try again.');
        alert('OCR Failed to process. Please try a clearer image.');
        resetScanner();
    }
}

// Update UI Progress bar
function updateProgress(fraction, text) {
    ocrStatusText.textContent = text;
    const percentage = Math.round(fraction * 100);
    ocrProgressPercent.textContent = `${percentage}%`;
    ocrProgressBar.style.width = `${percentage}%`;
}

// Handle Success OCR Text extraction
function handleOcrSuccess(text) {
    // Populate raw text collapse
    extractedRawText.textContent = text;

    // Parse phone number
    const result = parsePhoneNumber(text, settings.defaultCountryCode);
    
    // Fill result fields
    countrySelect.value = result.countryCode;
    phoneNumberInput.value = result.localNumber;
    
    // Fill message preview (draft from template)
    whatsappMessageInput.value = settings.defaultMessageTemplate;

    // Switch view
    processingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
}

// Parse Phone Number from Scanned Card Text
function parsePhoneNumber(rawText, defaultCountryCode) {
    const PHONE_KEYWORDS = ['tel', 'mob', 'cell', 'phone', 'whatsapp', 'ph:', 'm:', 'p:', 't:', 'contact'];
    
    // Clean defaultCountryCode to digits only (e.g., '+91' -> '91')
    const cleanDefault = defaultCountryCode.replace(/[^\d]/g, '');
    
    // Matches candidate numbers that contain spaces, dashes, dots, parentheses
    const regex = /\+?[\d-.\s()]{7,22}\d/g;
    const matches = rawText.match(regex) || [];
    
    const candidates = matches.map(match => {
        const cleaned = match.replace(/[^\d+]/g, '');
        const digitsOnly = cleaned.replace(/\+/g, '');
        
        // Skip if digit length is not standard (E.164 phone numbers have 8 to 15 digits)
        if (digitsOnly.length < 8 || digitsOnly.length > 15) {
            return null;
        }

        // Skip if it's formatted like a date (e.g. YYYY-MM-DD or YYYY.MM.DD)
        const trimmedMatch = match.trim();
        if (/^\d{4}[-./]\d{2}[-./]\d{2}$/.test(trimmedMatch)) {
            return null;
        }

        // Calculate score
        let score = 0;
        
        // 1. Check for international prefix
        if (cleaned.startsWith('+')) {
            score += 15;
        }

        // 2. Check for keywords near the match in the raw text
        const matchIndex = rawText.indexOf(match);
        if (matchIndex !== -1) {
            const lookbackStart = Math.max(0, matchIndex - 25);
            const lookbackText = rawText.substring(lookbackStart, matchIndex).toLowerCase();
            
            const hasKeyword = PHONE_KEYWORDS.some(kw => lookbackText.includes(kw));
            if (hasKeyword) {
                score += 30;
            }
            
            if (lookbackText.includes('fax')) {
                score -= 15; // penalize fax numbers
            }
        }

        // 3. Length score (longer number preferred over short local/zip codes)
        score += digitsOnly.length;

        return {
            original: match,
            cleaned: cleaned,
            score: score
        };
    }).filter(c => c !== null);

    if (candidates.length === 0) {
        return { countryCode: cleanDefault, localNumber: '' };
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    // Grab the best candidate
    const candidate = candidates[0].cleaned;

    if (candidate.startsWith('+')) {
        const codeAndNumber = candidate.substring(1); // Strip '+'

        // Loop through base codes to find prefix matches, checking longest prefixes first
        const matchedCC = BASE_COUNTRY_CODES
            .map(cc => cc.code)
            .sort((a, b) => b.length - a.length)
            .find(prefix => codeAndNumber.startsWith(prefix));

        if (matchedCC) {
            return {
                countryCode: matchedCC,
                localNumber: codeAndNumber.substring(matchedCC.length)
            };
        }

        // Custom unmatched country code (guess first 2 digits or let user handle)
        return {
            countryCode: cleanDefault,
            localNumber: candidate
        };
    } else {
        // Local number check. Does it start with the default code (e.g. 91)?
        if (candidate.startsWith(cleanDefault) && candidate.length > cleanDefault.length + 5) {
            return {
                countryCode: cleanDefault,
                localNumber: candidate.substring(cleanDefault.length)
            };
        }

        // UK/Australian leading zero handling (e.g., 07946 0958 -> 7946 0958)
        let local = candidate;
        if (local.startsWith('0') && local.length > 5) {
            local = local.substring(1);
        }

        return {
            countryCode: cleanDefault,
            localNumber: local
        };
    }
}

// Cancel current OCR worker
async function cancelOcr() {
    if (currentWorker) {
        try {
            await currentWorker.terminate();
        } catch (e) {
            console.error("Worker cleanup issue: ", e);
        }
        currentWorker = null;
    }
    resetScanner();
}

// Send WhatsApp Click-to-Chat trigger
function sendWhatsAppMessage() {
    const selectedCC = countrySelect.value.replace(/[^\d]/g, '');
    const enteredLocal = phoneNumberInput.value.replace(/[^\d]/g, '');
    const messageText = whatsappMessageInput.value;

    if (!enteredLocal) {
        alert('Please enter or confirm a valid phone number.');
        return;
    }

    // Combine for full international E.164 phone format
    const fullNumber = `${selectedCC}${enteredLocal}`;
    const encodedMessage = encodeURIComponent(messageText);

    // official whatsapp wa.me endpoint
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodedMessage}`;
    
    // Redirect / open in new tab (which triggers native mobile app redirect)
    window.open(whatsappUrl, '_blank');
}

// Reset scanner views back to original
function resetScanner() {
    stopCamera();
    
    // Reset file input value
    fileInput.value = '';

    // Clear outputs
    phoneNumberInput.value = '';
    whatsappMessageInput.value = '';
    extractedRawText.textContent = '';

    // Clear preview canvas
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Switch panels
    resultsSection.classList.add('hidden');
    processingSection.classList.add('hidden');
    scannerSection.classList.remove('hidden');

    // Restart camera if it was the selected tab
    if (activeTab === 'camera') {
        startCamera();
    }
}

// Save Configuration settings
function saveSettings() {
    let cc = defaultCountryCodeInput.value.trim();
    if (cc && !cc.startsWith('+')) {
        cc = '+' + cc;
    }
    const msg = defaultMessageTemplateInput.value;

    settings.defaultCountryCode = cc || '+91';
    settings.defaultMessageTemplate = msg;

    localStorage.setItem('cc_default_country_code', settings.defaultCountryCode);
    localStorage.setItem('cc_default_message', settings.defaultMessageTemplate);

    // Redraw country code dropdown options
    populateCountryDropdown();

    // Close modal
    settingsModal.classList.add('hidden');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
