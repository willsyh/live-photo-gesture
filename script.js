let currentStep = 1;
const totalSteps = 4;
const onboardingModal = document.getElementById('onboardingModal');
const btnNext = document.getElementById('btnNext');
const btnBack = document.getElementById('btnBack');
const dots = document.querySelectorAll('.dot');

const burgerBtn = document.getElementById('burgerBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideMenu = document.getElementById('sideMenu');

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const photoFrame = document.getElementById('photoFrame');
const statusText = document.getElementById('statusText');
const emotionStatus = document.getElementById('emotionStatus');

const audioLawan = document.getElementById('audioLawan');
const audioBlur = document.getElementById('audioBlur');
const audioTelunjuk = document.getElementById('audioTelunjuk');
const audioCemberut = document.getElementById('audioCemberut');
const audioTutupMulut = document.getElementById('audioTutupMulut');
const audioNgangap = document.getElementById('audioNgangap');
const audioMetal = document.getElementById('audioMetal');
const audioSarangheyo = document.getElementById('audioSarangheyo');

let currentMode = 'normal';
let isDetecting = false;
let handMode = 'normal';
let faceMode = 'normal';
let mouthPos = null;
let handPos = null;
let lastParticleTime = 0;

// Debounce - gesture harus stabil beberapa frame
let lastHandMode = 'normal';
let handModeCount = 0;
const HAND_MODE_THRESHOLD = 2;
let pendingHandMode = 'normal';

function updateStepper() {
    for (let i = 1; i <= totalSteps; i++) {
        document.getElementById(`step${i}`).style.display = (i === currentStep) ? 'block' : 'none';
    }
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 === currentStep);
    });
    btnBack.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    btnNext.innerText = (currentStep === totalSteps) ? 'Mulai Kamera' : 'Lanjut';
}

btnNext.addEventListener('click', () => {
    if (currentStep < totalSteps) {
        currentStep++;
        updateStepper();
    } else {
        startSystem();
    }
});

btnBack.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        updateStepper();
    }
});

burgerBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeMenuBtn.addEventListener('click', () => sideMenu.classList.remove('open'));

function stopAllSound() {
    [audioLawan, audioBlur, audioTelunjuk, audioCemberut, audioTutupMulut, audioNgangap, audioMetal, audioSarangheyo].forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

function playSound(audioToPlay) {
    stopAllSound();
    if (audioToPlay.paused) {
        audioToPlay.play().catch(() => {});
    }
}

function spawnParticles(emoji) {
    const now = Date.now();
    if (now - lastParticleTime < 280) return;
    lastParticleTime = now;

    const frameRect = photoFrame.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.innerText = emoji;
        
        const randomX = frameRect.left + Math.random() * frameRect.width;
        const randomY = frameRect.top + Math.random() * frameRect.height;
        
        particle.style.left = `${randomX}px`;
        particle.style.top = `${randomY}px`;
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

function updateState(mode) {
    if (currentMode === mode) {
        if (mode === 'blur') spawnParticles('😆');
        if (mode === 'lawan') spawnParticles('🔥');
        if (mode === 'cemberut') spawnParticles('😡');
        if (mode === 'telunjuk') spawnParticles('☝️');
        if (mode === 'tutup_mulut') spawnParticles('🤭');
        if (mode === 'ngangap') spawnParticles('😲');
        if (mode === 'metal') spawnParticles('🤟');
        if (mode === 'sarangheyo') spawnParticles('❤️');
        return;
    }
    
    currentMode = mode;
    
    if (mode === 'normal') {
        statusText.innerText = "✋ Normal";
        statusText.style.background = "#5eff5e";
        statusText.style.color = "#000";
        photoFrame.className = 'photo-frame';
        stopAllSound();
    } else if (mode === 'blur') {
        statusText.innerText = "✌️ Blur Mode";
        statusText.style.background = "var(--accent-blur)";
        statusText.style.color = "#000";
        photoFrame.className = 'photo-frame state-blur';
        playSound(audioBlur);
    } else if (mode === 'lawan') {
        statusText.innerText = "✊ Lawan Mode";
        statusText.style.background = "var(--accent-lawan)";
        statusText.style.color = "#fff";
        photoFrame.className = 'photo-frame state-lawan';
        playSound(audioLawan);
    } else if (mode === 'telunjuk') {
        statusText.innerText = "☝️ Telunjuk";
        statusText.style.background = "#ff9900";
        statusText.style.color = "#000";
        photoFrame.className = 'photo-frame';
        playSound(audioTelunjuk);
    } else if (mode === 'cemberut') {
        statusText.innerText = "😡 Cemberut";
        statusText.style.background = "var(--accent-lawan)";
        statusText.style.color = "#fff";
        photoFrame.className = 'photo-frame state-lawan';
        playSound(audioCemberut);
    } else if (mode === 'tutup_mulut') {
        statusText.innerText = "🤭 Tutup Mulut";
        statusText.style.background = "#ffcc00";
        statusText.style.color = "#000";
        photoFrame.className = 'photo-frame';
        playSound(audioTutupMulut);
    } else if (mode === 'ngangap') {
        statusText.innerText = "😲 Ngangap";
        statusText.style.background = "var(--accent-blur)";
        statusText.style.color = "#000";
        photoFrame.className = 'photo-frame';
        playSound(audioNgangap);
    } else if (mode === 'metal') {
        statusText.innerText = "🤟 Metal";
        statusText.style.background = "#b300ff";
        statusText.style.color = "#fff";
        photoFrame.className = 'photo-frame state-lawan';
        playSound(audioMetal);
    } else if (mode === 'sarangheyo') {
        statusText.innerText = "❤️ Sarangheyo";
        statusText.style.background = "#ff6b9d";
        statusText.style.color = "#fff";
        photoFrame.className = 'photo-frame state-lawan';
        playSound(audioSarangheyo);
    }
}

function checkCombinedState() {
    let finalMode = 'normal';

    if (mouthPos && handPos) {
        const distance = Math.hypot(mouthPos.x - handPos.x, mouthPos.y - handPos.y);
        if (distance < 0.15) {
            updateState('tutup_mulut');
            return;
        }
    }

    if (faceMode === 'ngangap') {
        finalMode = 'ngangap';
    } else if (faceMode === 'cemberut') {
        finalMode = 'cemberut';
    } else if (handMode === 'sarangheyo') {
        finalMode = 'sarangheyo';
    } else if (handMode === 'metal') {
        finalMode = 'metal';
    } else if (handMode === 'lawan') {
        finalMode = 'lawan';
    } else if (handMode === 'blur') {
        finalMode = 'blur';
    } else if (handMode === 'telunjuk') {
        finalMode = 'telunjuk';
    }

    updateState(finalMode);
}

function onHandResults(results) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        handPos = { x: landmarks[9].x, y: landmarks[9].y };

        const indexOpen = landmarks[8].y < landmarks[6].y;
        const middleOpen = landmarks[12].y < landmarks[10].y;
        const ringOpen = landmarks[16].y < landmarks[14].y;
        const pinkyOpen = landmarks[20].y < landmarks[18].y;
        
        const openedFingers = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

        // Deteksi Sarangheyo (Korean Heart) - jempol & telunjuk bersatu
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const thumbIndexDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        // Deteksi Sarangheyo - jempol & telunjuk dekat
        const isSarangheyo = thumbIndexDist < 0.22 && openedFingers >= 1;

        if (openedFingers === 4) {
            handMode = 'normal';
        } else if (isSarangheyo) {
            handMode = 'sarangheyo';
        } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
            handMode = 'lawan';
        } else if (indexOpen && !middleOpen && !ringOpen && pinkyOpen) {
            handMode = 'metal';
        } else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
            handMode = 'blur';
        } else if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
            handMode = 'telunjuk';
        } else {
            handMode = 'normal';
        }

        // Debounce: deteksi gesture harus stabil beberapa frame
        if (handMode === pendingHandMode) {
            handModeCount++;
        } else {
            pendingHandMode = handMode;
            handModeCount = 1;
        }

        // Hanya ubah mode jika sudah stabil
        if (handModeCount >= HAND_MODE_THRESHOLD) {
            handMode = pendingHandMode;
        } else {
            handMode = lastHandMode;
        }

    } else {
        handMode = 'normal';
        handPos = null;
        handModeCount = 0;
        pendingHandMode = 'normal';
    }

    // Simpan mode terakhir
    lastHandMode = handMode;
    checkCombinedState();
}

function onFaceResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        emotionStatus.innerText = "Wajah: Tidak terdeteksi";
        emotionStatus.style.background = "#fff";
        emotionStatus.style.color = "#000";
        faceMode = 'normal';
        mouthPos = null;
        checkCombinedState();
        return;
    }

    const lm = results.multiFaceLandmarks[0];
    mouthPos = { x: lm[13].x, y: lm[13].y };

    if (handPos) {
        const distance = Math.hypot(mouthPos.x - handPos.x, mouthPos.y - handPos.y);
        if (distance < 0.15) {
            emotionStatus.innerText = "Wajah: Tertutup tangan 🤭";
            emotionStatus.style.background = "#ffcc00";
            emotionStatus.style.color = "#000";
            checkCombinedState();
            return;
        }
    }

    const upperInnerLip = lm[13];
    const lowerInnerLip = lm[14];
    const mouthOpenDist = Math.hypot(upperInnerLip.x - lowerInnerLip.x, upperInnerLip.y - lowerInnerLip.y);

    const leftMouth = lm[61].y;
    const rightMouth = lm[291].y;
    const bottomLip = lm[14].y;
    const avgCorner = (leftMouth + rightMouth) / 2;
    const diff = avgCorner - bottomLip;

    if (mouthOpenDist > 0.04) {
        emotionStatus.innerText = `Wajah: 😲 Ngangap`;
        emotionStatus.style.background = "#00e5ff";
        emotionStatus.style.color = "#000";
        faceMode = 'ngangap';
    } else if (diff > 0.005) {
        emotionStatus.innerText = `Wajah: 😡 Cemberut`;
        emotionStatus.style.background = "#ff3333";
        emotionStatus.style.color = "#fff";
        faceMode = 'cemberut';
    } else if (diff < -0.01) {
        emotionStatus.innerText = `Wajah: 😁 Senyum`;
        emotionStatus.style.background = "#5eff5e";
        emotionStatus.style.color = "#000";
        faceMode = 'normal';
    } else {
        emotionStatus.innerText = `Wajah: 😐 Datar`;
        emotionStatus.style.background = "#fff";
        emotionStatus.style.color = "#000";
        faceMode = 'normal';
    }
    
    checkCombinedState();
}

async function startSystem() {
    onboardingModal.style.display = 'none';
    statusText.innerText = "Meminta izin kamera...";

    [audioLawan, audioBlur, audioTelunjuk, audioCemberut, audioTutupMulut, audioNgangap, audioMetal, audioSarangheyo].forEach(audio => {
        audio.play().then(() => audio.pause()).catch(() => {});
    });

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } 
        });
        
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            isDetecting = true;
            statusText.innerText = "Kamera siap!";
            runAI();
        };
    } catch (err) {
        statusText.innerText = "Akses kamera ditolak";
    }
}

function runAI() {
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(onHandResults);

    const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    faceMesh.onResults(onFaceResults);

    async function detectFrame() {
        if (!isDetecting) return;
        await hands.send({ image: videoElement });
        await faceMesh.send({ image: videoElement });
        requestAnimationFrame(detectFrame);
    }
    detectFrame();
}

// ==================== FITUR FOTO ====================

// DOM Elements
const captureCanvas = document.getElementById('captureCanvas');
const captureCtx = captureCanvas.getContext('2d');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const albumBtn = document.getElementById('albumBtn');
const albumModal = document.getElementById('albumModal');
const closeAlbumBtn = document.getElementById('closeAlbumBtn');
const albumGrid = document.getElementById('albumGrid');
const photoCount = document.getElementById('photoCount');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// State
let photos = [];
let isCountingDown = false;
let wasFiveFingers = false;

// Supabase Config - from config.js
const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
const AUDIO_BUCKET = CONFIG.AUDIO_BUCKET;
const PHOTO_BUCKET = CONFIG.PHOTO_BUCKET;

// Deteksi gesture 5 jari → kepal untuk trigger foto
function checkPhotoTrigger(currentHandMode) {
    if (isCountingDown) return;

    if (currentHandMode === 'normal') {
        wasFiveFingers = true;
    } else if (currentHandMode === 'lawan' && wasFiveFingers) {
        wasFiveFingers = false;
        startCountdown();
    } else if (currentHandMode !== 'normal' && currentHandMode !== 'lawan') {
        wasFiveFingers = false;
    }
}

// Hitung mundur 3-2-1
async function startCountdown() {
    isCountingDown = true;
    countdownOverlay.style.display = 'flex';

    for (let i = 3; i >= 1; i--) {
        countdownNumber.innerText = i;
        countdownNumber.style.animation = 'none';
        countdownNumber.offsetHeight; // trigger reflow
        countdownNumber.style.animation = 'pulse 0.5s ease-in-out';
        await sleep(1000);
    }

    countdownOverlay.style.display = 'none';
    capturePhoto();
    isCountingDown = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Ambil foto
function capturePhoto() {
    // Draw video to capture canvas (with mirror)
    captureCtx.save();
    captureCtx.scale(-1, 1);
    captureCtx.drawImage(videoElement, -captureCanvas.width, 0, captureCanvas.width, captureCanvas.height);
    captureCtx.restore();

    // Convert to blob
    captureCanvas.toBlob(async (blob) => {
        const timestamp = Date.now();
        const filename = `foto_${timestamp}.jpg`;

        const photoData = {
            id: timestamp,
            filename: filename,
            blob: blob,
            url: URL.createObjectURL(blob),
            supabaseUrl: null,
            uploading: false
        };

        photos.push(photoData);
        updatePhotoCount();
        renderAlbum();

        // Flash effect
        flashEffect();

        // Upload ke Supabase
        await uploadToSupabase(photoData);
    }, 'image/jpeg', 0.9);
}

// Flash effect saat foto diambil
function flashEffect() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: white; z-index: 9998; opacity: 1;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(flash);
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 300);
    }, 100);
}

// Upload ke Supabase Storage
async function uploadToSupabase(photoData) {
    photoData.uploading = true;
    renderAlbum();

    try {
        console.log('Mengupload:', photoData.filename);
        const response = await fetch(
            `${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${photoData.filename}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'image/jpeg',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: photoData.blob
            }
        );

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response:', responseText);

        if (response.ok) {
            photoData.supabaseUrl = `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${photoData.filename}`;
            console.log('Upload berhasil!');
        } else {
            console.error('Upload gagal:', response.status, responseText);
        }
    } catch (err) {
        console.error('Upload error:', err);
    }

    photoData.uploading = false;
    renderAlbum();
}

// Update counter foto
function updatePhotoCount() {
    photoCount.innerText = photos.length;
}

// Render album
function renderAlbum() {
    if (photos.length === 0) {
        albumGrid.innerHTML = '<p class="album-empty">Belum ada foto. Pose ✋ lalu ✊ untuk ambil foto!</p>';
        downloadAllBtn.style.display = 'none';
        return;
    }

    downloadAllBtn.style.display = 'block';

    albumGrid.innerHTML = photos.map(photo => `
        <div class="album-item" data-id="${photo.id}">
            <img src="${photo.url}" alt="${photo.filename}">
            <div class="album-item-actions">
                <button onclick="downloadPhoto(${photo.id})">Save</button>
                <button onclick="sharePhoto(${photo.id})">Share</button>
                <button class="btn-delete" onclick="deletePhoto(${photo.id})">Hapus</button>
            </div>
            ${photo.uploading ? '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;">Uploading...</div>' : ''}
        </div>
    `).join('');
}

// Download single foto
function downloadPhoto(id) {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.filename;
    link.click();
}

// Share foto
async function sharePhoto(id) {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    if (navigator.share) {
        try {
            const file = new File([photo.blob], photo.filename, { type: 'image/jpeg' });
            await navigator.share({ files: [file] });
        } catch (err) {
            console.log('Share dibatalkan');
        }
    } else {
        // Fallback: copy URL
        const urlToShare = photo.supabaseUrl || photo.url;
        navigator.clipboard.writeText(urlToShare);
        alert('Link foto disalin ke clipboard!');
    }
}

// Hapus foto
function deletePhoto(id) {
    const index = photos.findIndex(p => p.id === id);
    if (index === -1) return;

    URL.revokeObjectURL(photos[index].url);
    photos.splice(index, 1);
    updatePhotoCount();
    renderAlbum();
}

// Download semua foto
function downloadAllPhotos() {
    photos.forEach((photo, i) => {
        setTimeout(() => downloadPhoto(photo.id), i * 500);
    });
}

// Event Listeners
albumBtn.addEventListener('click', () => {
    albumModal.style.display = 'flex';
    renderAlbum();
});

closeAlbumBtn.addEventListener('click', () => {
    albumModal.style.display = 'none';
});

downloadAllBtn.addEventListener('click', downloadAllPhotos);

// Hook into existing gesture detection
const originalCheckCombinedState = checkCombinedState;
checkCombinedState = function() {
    originalCheckCombinedState();
    checkPhotoTrigger(handMode);
};

// ==================== FITUR CUSTOM WARNA ====================

const themeBtn = document.getElementById('themeBtn');
const themeModal = document.getElementById('themeModal');
const closeThemeBtn = document.getElementById('closeThemeBtn');
const customColorPicker = document.getElementById('customColorPicker');
const applyCustomColor = document.getElementById('applyCustomColor');
const resetThemeBtn = document.getElementById('resetThemeBtn');

// Default colors
const defaultColors = {
    primary: '#10b981',
    gradient: null
};

// Load saved theme
function loadTheme() {
    const saved = localStorage.getItem('buttonTheme');
    if (saved) {
        const theme = JSON.parse(saved);
        if (theme.gradient) {
            applyButtonColor(theme.gradient);
        } else if (theme.color) {
            applyButtonColor(theme.color);
        }
    }
}

// Apply color to ALL buttons (except theme picker)
function applyButtonColor(colorOrGradient) {
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        // Skip theme picker buttons and utility buttons
        if (btn.closest('.theme-modal')) return;
        if (btn.id === 'themeBtn') return;
        if (btn.classList.contains('btn-back')) return;
        if (btn.classList.contains('close-album')) return;
        if (btn.classList.contains('close-menu')) return;
        if (btn.classList.contains('btn-delete')) return;
        if (btn.classList.contains('burger-btn')) return;

        // Add pulse animation
        btn.classList.remove('color-changing');
        void btn.offsetWidth; // Force reflow
        btn.classList.add('color-changing');
        setTimeout(() => btn.classList.remove('color-changing'), 300);

        if (colorOrGradient.includes('gradient')) {
            btn.style.background = colorOrGradient;
            btn.style.color = '#fff';
        } else {
            btn.style.background = colorOrGradient;
            const hex = colorOrGradient.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            btn.style.color = luminance > 0.5 ? '#000' : '#fff';
        }
    });
}

// Save theme
function saveTheme(theme) {
    localStorage.setItem('buttonTheme', JSON.stringify(theme));
}

// Open/close modal with smooth animation
themeBtn.addEventListener('click', () => {
    themeModal.style.display = 'flex';
    requestAnimationFrame(() => themeModal.classList.add('show'));
});

closeThemeBtn.addEventListener('click', () => {
    themeModal.classList.remove('show');
    setTimeout(() => themeModal.style.display = 'none', 300);
});

themeModal.addEventListener('click', (e) => {
    if (e.target === themeModal) {
        themeModal.classList.remove('show');
        setTimeout(() => themeModal.style.display = 'none', 300);
    }
});

// Preset colors
document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        applyButtonColor(color);
        saveTheme({ color });
        document.querySelectorAll('.theme-preset, .theme-gradient').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Gradient colors
document.querySelectorAll('.theme-gradient').forEach(btn => {
    btn.addEventListener('click', () => {
        const gradient = btn.dataset.gradient;
        applyButtonColor(gradient);
        saveTheme({ gradient });
        document.querySelectorAll('.theme-preset, .theme-gradient').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Custom color picker
applyCustomColor.addEventListener('click', () => {
    const color = customColorPicker.value;
    applyButtonColor(color);
    saveTheme({ color });
    document.querySelectorAll('.theme-preset, .theme-gradient').forEach(b => b.classList.remove('active'));
});

// Reset to default
resetThemeBtn.addEventListener('click', () => {
    // Clear all button styles
    document.querySelectorAll('button').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
    });
    document.documentElement.style.removeProperty('--user-btn-color');
    document.documentElement.style.removeProperty('--user-btn-is-gradient');
    localStorage.removeItem('buttonTheme');
    document.querySelectorAll('.theme-preset, .theme-gradient').forEach(b => b.classList.remove('active'));
});

// Load theme on page load
loadTheme();

// ==================== FITUR PHOTOBOOTH ====================

const photoboothBtn = document.getElementById('photoboothBtn');
const photoboothModal = document.getElementById('photoboothModal');
const closePhotoboothBtn = document.getElementById('closePhotoboothBtn');
const pbWebcam = document.getElementById('pbWebcam');
const pbOutputCanvas = document.getElementById('pbOutputCanvas');
const pbOutputCtx = pbOutputCanvas.getContext('2d');
const pbCaptureCanvas = document.getElementById('pbCaptureCanvas');
const pbCaptureCtx = pbCaptureCanvas.getContext('2d');
const pbFrameOverlay = document.getElementById('pbFrameOverlay');
const pbCountdown = document.getElementById('pbCountdown');
const pbCaptureBtn = document.getElementById('pbCaptureBtn');
const pbFrameList = document.getElementById('pbFrameList');
const pbResultModal = document.getElementById('pbResultModal');
const pbResultImage = document.getElementById('pbResultImage');
const pbSaveBtn = document.getElementById('pbSaveBtn');
const pbRetakeBtn = document.getElementById('pbRetakeBtn');

let pbStream = null;
let selectedFrame = 'none';
let pbPhotos = [];

// Open photobooth
photoboothBtn.addEventListener('click', async () => {
    photoboothModal.style.display = 'flex';
    try {
        pbStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        pbWebcam.srcObject = pbStream;
        pbWebcam.play();
        drawPbFrameLoop();
    } catch (err) {
        console.error('Kamera photobooth gagal:', err);
        closePhotobooth();
    }
});

// Close photobooth
function closePhotobooth() {
    photoboothModal.style.display = 'none';
    if (pbStream) {
        pbStream.getTracks().forEach(track => track.stop());
        pbStream = null;
    }
}

closePhotoboothBtn.addEventListener('click', closePhotobooth);

// Draw frame on canvas
function drawPbFrame(ctx, width, height) {
    if (selectedFrame === 'none') return;

    ctx.save();

    if (selectedFrame === 'polaroid') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, 30);
        ctx.fillRect(0, height - 60, width, 60);
        ctx.fillRect(0, 0, 30, height);
        ctx.fillRect(width - 30, 0, 30, height);
    } else if (selectedFrame === 'film') {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, 20);
        ctx.fillRect(0, height - 20, width, 20);
        ctx.fillRect(0, 0, 20, height);
        ctx.fillRect(width - 20, 0, 20, height);
        ctx.fillStyle = '#444';
        for (let i = 0; i < width; i += 30) {
            ctx.fillRect(i, 5, 15, 10);
            ctx.fillRect(i, height - 15, 15, 10);
        }
    } else if (selectedFrame === 'neon') {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#a855f7';
        ctx.strokeRect(10, 10, width - 20, height - 20);
        ctx.shadowBlur = 0;
    } else if (selectedFrame === 'hearts' || selectedFrame === 'stars' || selectedFrame === 'floral') {
        let emoji = selectedFrame === 'hearts' ? '💕' : selectedFrame === 'stars' ? '⭐' : '🌸';
        ctx.font = '24px Arial';
        ctx.fillText(emoji, 15, 30);
        ctx.fillText(emoji, width - 40, 30);
        ctx.fillText(emoji, 15, height - 10);
        ctx.fillText(emoji, width - 40, height - 10);
    } else if (selectedFrame === 'retro') {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f97316');
        gradient.addColorStop(0.5, '#fbbf24');
        gradient.addColorStop(1, '#f97316');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 15;
        ctx.strokeRect(8, 8, width - 16, height - 16);
    }

    ctx.restore();
}

// Continuous draw for preview
function drawPbFrameLoop() {
    if (!pbStream) return;
    pbOutputCtx.clearRect(0, 0, pbOutputCanvas.width, pbOutputCanvas.height);
    drawPbFrame(pbOutputCtx, pbOutputCanvas.width, pbOutputCanvas.height);
    requestAnimationFrame(drawPbFrameLoop);
}

// Frame selector
pbFrameList.addEventListener('click', (e) => {
    const btn = e.target.closest('.pb-frame-item');
    if (!btn) return;

    document.querySelectorAll('.pb-frame-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFrame = btn.dataset.frame;

    pbFrameOverlay.className = 'pb-frame-overlay';
    if (selectedFrame !== 'none') {
        pbFrameOverlay.classList.add(`frame-${selectedFrame}`);
    }
});

// Capture photo
pbCaptureBtn.addEventListener('click', startPbCountdown);

async function startPbCountdown() {
    pbCountdown.style.display = 'block';

    for (let i = 3; i >= 1; i--) {
        pbCountdown.innerText = i;
        pbCountdown.style.animation = 'none';
        pbCountdown.offsetHeight;
        pbCountdown.style.animation = 'pbPulse 0.5s ease-in-out';
        await new Promise(r => setTimeout(r, 1000));
    }

    pbCountdown.style.display = 'none';
    capturePbPhoto();
}

function capturePbPhoto() {
    pbCaptureCtx.save();
    pbCaptureCtx.scale(-1, 1);
    pbCaptureCtx.drawImage(pbWebcam, -640, 0, 640, 480);
    pbCaptureCtx.restore();

    drawPbFrame(pbCaptureCtx, 640, 480);

    pbCaptureCanvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        pbResultImage.src = url;
        pbResultModal.style.display = 'flex';

        const photoData = {
            id: Date.now(),
            filename: `photobooth_${Date.now()}.jpg`,
            blob: blob,
            url: url,
            supabaseUrl: null,
            uploading: false
        };

        pbPhotos.push(photoData);
        photos.push(photoData);
        updatePhotoCount();
        await uploadToSupabase(photoData);
    }, 'image/jpeg', 0.95);
}

// Save / retake
pbSaveBtn.addEventListener('click', () => {
    pbResultModal.style.display = 'none';
    const lastPhoto = pbPhotos[pbPhotos.length - 1];
    if (lastPhoto) downloadPhoto(lastPhoto.id);
});

pbRetakeBtn.addEventListener('click', () => {
    pbResultModal.style.display = 'none';
});
