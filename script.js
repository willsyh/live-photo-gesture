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
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const countdownLabel = document.getElementById('countdownLabel');
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

// Supabase Config - from config.js (opsional; tanpa config.js foto tidak di-upload)
const APP_CONFIG = (typeof CONFIG !== 'undefined' && CONFIG) || {};
const SUPABASE_URL = APP_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = APP_CONFIG.SUPABASE_ANON_KEY;
const AUDIO_BUCKET = APP_CONFIG.AUDIO_BUCKET;
const PHOTO_BUCKET = APP_CONFIG.PHOTO_BUCKET;

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

// Hitung mundur 3-2-1 (diulang untuk bingkai yang butuh beberapa foto)
async function startCountdown() {
    isCountingDown = true;
    const frame = buildFrame(selectedThemeId, selectedLayoutId);
    const totalShots = frame.shots || 1;
    const shots = [];
    shuffleIdolPoses();
    const idolPlan = idolPlanFor(totalShots);

    for (let s = 0; s < totalShots; s++) {
        countdownLabel.innerText = totalShots > 1 ? `Foto ${s + 1} dari ${totalShots}` : '';
        countdownOverlay.style.display = 'flex';
        if (idolPlan.length) showIdolOverlay(idolPlan[s]);

        for (let i = 3; i >= 1; i--) {
            countdownNumber.innerText = i;
            countdownNumber.style.animation = 'none';
            countdownNumber.offsetHeight; // trigger reflow
            countdownNumber.style.animation = 'pulse 0.5s ease-in-out';
            await sleep(1000);
        }

        countdownOverlay.style.display = 'none';
        shots.push(snapshotVideo(videoElement));
        flashEffect();
        if (s < totalShots - 1) await sleep(900); // jeda ganti pose
    }

    updateIdolView();
    savePhoto(frame, shots, idolPlan);
    isCountingDown = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Gabungkan jepretan ke bingkai lalu simpan ke album
function savePhoto(frame, shots, idolPlan = []) {
    const framed = renderFramed(frame, drawShots(shots, i => idolPlan[i]));

    const onBlob = async (blob) => {
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

        // Upload ke Supabase
        await uploadToSupabase(photoData);
    };

    try {
        framed.toBlob(onBlob, 'image/jpeg', 0.92);
    } catch (err) {
        // Terjadi kalau halaman dibuka langsung dari file (file://) dan memakai template gambar
        console.error('Gagal menyimpan foto:', err);
        alert('Foto dengan template gambar tidak bisa disimpan kalau halaman dibuka langsung dari file. Buka lewat server (misalnya Live Server atau situs Vercel).');
    }
}

// ==================== FOTO BARENG IDOL ====================
const idolOverlay = document.getElementById('idolOverlay');
const idolGroupList = document.getElementById('idolGroupList');
const idolMemberList = document.getElementById('idolMemberList');
const idolOptions = document.getElementById('idolOptions');
const idolName = document.getElementById('idolName');
const idolMissing = document.getElementById('idolMissing');
const idolSizeInput = document.getElementById('idolSize');
const idolSideButtons = document.querySelectorAll('.idol-side-btn');

// Pratinjau bingkai baru boleh digambar setelah bagian bingkai siap
let framePreviewReady = false;

const idolState = {
    group: readSetting('idolGroup', 'none'),
    member: readSetting('idolMember', 'all'),
    side: readSetting('idolSide', 'right') === 'left' ? 'left' : 'right',
    size: Number(readSetting('idolSize', '90')) || 90
};
if (!getIdolGroup(idolState.group)) idolState.group = 'none';

function saveIdolState() {
    saveSetting('idolGroup', idolState.group);
    saveSetting('idolMember', idolState.member);
    saveSetting('idolSide', idolState.side);
    saveSetting('idolSize', String(idolState.size));
}

// Semua gambar pose milik member (dimuat sekali, lalu disimpan di cache)
function idolPoseImages(group, member) {
    return idolSrcs(group, member).map(src => loadIdolImage(src, onIdolImagesChanged));
}

function readyIdolPoses(group, member) {
    return idolPoseImages(group, member).filter(idolReady);
}

// Titik awal urutan pose; diacak setiap kali mulai jepret supaya posenya bervariasi
let idolPoseOffset = 0;

// Member yang dipakai, sesuai pilihan (satu member, atau semua yang fotonya ada)
function activeIdolMembers() {
    const group = getIdolGroup(idolState.group);
    if (!group) return [];
    const available = group.members.filter(m => readyIdolPoses(group, m).length > 0);
    if (idolState.member === 'all') return available;
    return available.filter(m => m.id === idolState.member);
}

// Rencana idol per jepretan: member bergantian (kalau "Semua"),
// dan tiap jepretan memakai pose berikutnya dari member itu.
function idolPlanFor(totalShots) {
    const group = getIdolGroup(idolState.group);
    const members = activeIdolMembers();
    if (!group || members.length === 0) return [];
    const size = idolState.size / 100;
    return Array.from({ length: totalShots }, (_, i) => {
        const member = members[i % members.length];
        const poses = readyIdolPoses(group, member);
        const round = Math.floor(i / members.length);
        return {
            member,
            img: poses[(idolPoseOffset + round) % poses.length],
            side: idolState.side,
            size
        };
    });
}

function shuffleIdolPoses() {
    idolPoseOffset = Math.floor(Math.random() * 1000);
}

function showIdolOverlay(plan) {
    if (!plan) {
        idolOverlay.hidden = true;
        idolOverlay.removeAttribute('src');
        return;
    }
    idolOverlay.src = plan.img.src;
    idolOverlay.alt = plan.member.name;
    idolOverlay.className = `idol-overlay side-${plan.side}`;
    idolOverlay.style.height = `${idolState.size}%`;
    idolOverlay.hidden = false;
}

function updateIdolView() {
    const group = getIdolGroup(idolState.group);
    const plan = idolPlanFor(1)[0];
    showIdolOverlay(plan);

    if (!group) {
        idolName.innerText = 'Tanpa idol';
    } else if (idolState.member === 'all') {
        idolName.innerText = `${group.name} · Semua`;
    } else {
        const m = group.members.find(x => x.id === idolState.member);
        idolName.innerText = `${group.name} · ${m ? m.name : ''}`;
    }

    idolSideButtons.forEach(btn => btn.setAttribute('aria-checked', btn.dataset.side === idolState.side));
    idolSizeInput.value = idolState.size;
}

function makeIdolChip(label, value, attr, current, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'idol-chip';
    btn.dataset[attr] = value;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', value === current);
    btn.innerText = label;
    btn.addEventListener('click', onClick);
    return btn;
}

function buildIdolGroupList() {
    idolGroupList.innerHTML = '';
    idolGroupList.appendChild(makeIdolChip('Tanpa Idol', 'none', 'group', idolState.group, () => selectIdolGroup('none')));
    IDOL_GROUPS.forEach(g => {
        idolGroupList.appendChild(makeIdolChip(g.name, g.id, 'group', idolState.group, () => selectIdolGroup(g.id)));
    });
}

function buildIdolMemberList() {
    const group = getIdolGroup(idolState.group);
    idolOptions.hidden = !group;
    idolMemberList.innerHTML = '';
    if (!group) return;

    const missing = [];
    const makeMemberBtn = (id, name, img) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'idol-member';
        btn.dataset.member = id;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', id === idolState.member);

        const pic = document.createElement('span');
        pic.className = 'idol-member-pic';
        if (img && idolReady(img)) {
            const el = document.createElement('img');
            el.src = img.src;
            el.alt = '';
            pic.appendChild(el);
        } else {
            pic.innerText = id === 'all' ? '★' : name.charAt(0);
        }
        const label = document.createElement('span');
        label.className = 'idol-member-name';
        label.innerText = name;
        btn.append(pic, label);
        btn.addEventListener('click', () => {
            idolState.member = id;
            saveIdolState();
            buildIdolMemberList();
            onIdolSettingsChanged();
        });
        return btn;
    };

    let readyCount = 0;
    const memberButtons = group.members.map(m => {
        const poses = idolPoseImages(group, m);
        const readyPoses = poses.filter(idolReady);
        const ready = readyPoses.length > 0;
        if (ready) readyCount++;
        else if (poses.every(img => img.dataset.missing)) missing.push(m);
        const btn = makeMemberBtn(m.id, m.name, readyPoses[0]);
        if (ready && poses.length > 1) btn.title = `${readyPoses.length} pose`;
        if (!ready) {
            btn.disabled = true;
            btn.title = 'Foto belum ada';
        }
        return btn;
    });

    const allBtn = makeMemberBtn('all', 'Semua', null);
    allBtn.title = 'Ganti member tiap jepretan';
    allBtn.disabled = readyCount === 0;
    idolMemberList.append(allBtn, ...memberButtons);

    if (missing.length) {
        idolMissing.hidden = false;
        idolMissing.innerText = `Foto belum ada: ${missing.map(m => m.name).join(', ')}. ` +
            `Taruh file PNG transparan di folder idols/${group.id}/ (contoh: idols/${group.id}/${missing[0].id}.png).`;
    } else {
        idolMissing.hidden = true;
    }
}

function selectIdolGroup(id) {
    idolState.group = id;
    idolState.member = 'all';
    saveIdolState();
    buildIdolGroupList();
    buildIdolMemberList();
    onIdolSettingsChanged();
}

function onIdolSettingsChanged() {
    updateIdolView();
    if (typeof renderPreview === 'function' && framePreviewReady) renderPreview();
}

// Dipanggil setiap ada foto member yang selesai dimuat (atau gagal dimuat)
function onIdolImagesChanged() {
    buildIdolMemberList();
    onIdolSettingsChanged();
}

idolSideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        idolState.side = btn.dataset.side;
        saveIdolState();
        onIdolSettingsChanged();
    });
});

idolSizeInput.addEventListener('input', () => {
    idolState.size = Number(idolSizeInput.value);
    saveIdolState();
    onIdolSettingsChanged();
});

buildIdolGroupList();
buildIdolMemberList();
updateIdolView();

// ==================== PILIH BINGKAI (TEMA + TATA LETAK + TEMPLATE) ====================
const themeList = document.getElementById('frameList');
const templateList = document.getElementById('templateList');
const layoutList = document.getElementById('layoutList');
const layoutNote = document.getElementById('layoutNote');
const frameName = document.getElementById('frameName');
const framePreview = document.getElementById('framePreview');
const frameShotInfo = document.getElementById('frameShotInfo');

function readSetting(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch (e) {
        return fallback;
    }
}

function saveSetting(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) { /* localStorage tidak tersedia */ }
}

// Pilihan lama ('photoFrame') dipakai sebagai tema kalau masih ada
let selectedThemeId = getTheme(readSetting('photoTheme', readSetting('photoFrame', 'none'))).id;
let selectedLayoutId = getLayout(readSetting('photoLayout', '1')).id;

function isTemplateSelected() {
    return Boolean(getTheme(selectedThemeId).template);
}

function renderPreview() {
    const frame = buildFrame(selectedThemeId, selectedLayoutId);
    // pratinjau digambar kecil supaya ringan
    const scale = Math.min(1, 520 / Math.max(frame.width, frame.height));
    const plan = idolPlanFor(frame.shots);
    const img = renderFramed(frame, (ctx, x, y, w, h, shot) => {
        drawSamplePhoto(ctx, x, y, w, h, shot);
        const p = plan[shot];
        if (p) drawIdol(ctx, p.img, x, y, w, h, p.side, p.size);
    }, scale);
    framePreview.width = img.width;
    framePreview.height = img.height;
    framePreview.getContext('2d').drawImage(img, 0, 0);
    framePreview.setAttribute('aria-label', `Pratinjau bingkai ${frame.name}`);
    frameName.innerText = frame.name;
    frameShotInfo.innerText = frame.shots > 1
        ? `${frame.shots} kali jepret · hitung mundur tiap foto`
        : '1 kali jepret';
}

function markChecked(list, attr, value) {
    list.querySelectorAll('[role="radio"]').forEach(btn => {
        btn.setAttribute('aria-checked', btn.dataset[attr] === value);
    });
}

// Template punya susunan foto sendiri, jadi tata letak dinonaktifkan
function updateLayoutState() {
    const locked = isTemplateSelected();
    layoutList.classList.toggle('is-locked', locked);
    layoutList.querySelectorAll('button').forEach(btn => {
        btn.disabled = locked;
    });
    layoutNote.hidden = !locked;
}

function selectTheme(id) {
    selectedThemeId = id;
    saveSetting('photoTheme', id);
    markChecked(themeList, 'theme', id);
    markChecked(templateList, 'theme', id);
    updateLayoutState();
    renderPreview();
}

function makeThemeButton(theme) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frame-option';
    btn.dataset.theme = theme.id;
    btn.setAttribute('role', 'radio');
    btn.title = theme.name;

    const frame = buildFrame(theme.id, selectedLayoutId);
    const thumb = renderFramed(frame, drawSamplePhoto, 180 / Math.max(frame.width, frame.height));
    thumb.className = 'frame-thumb';
    const label = document.createElement('span');
    label.className = 'frame-label';
    label.innerText = theme.name;

    btn.append(thumb, label);
    btn.addEventListener('click', () => selectTheme(theme.id));
    return btn;
}

function buildThemeList() {
    themeList.innerHTML = '';
    THEMES.forEach(theme => themeList.appendChild(makeThemeButton(theme)));
    markChecked(themeList, 'theme', selectedThemeId);
}

function buildTemplateList() {
    templateList.innerHTML = '';
    TEMPLATES.forEach(theme => templateList.appendChild(makeThemeButton(theme)));
    markChecked(templateList, 'theme', selectedThemeId);
}

function buildLayoutList() {
    layoutList.innerHTML = '';
    LAYOUTS.forEach(layout => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'layout-option';
        btn.dataset.layout = layout.id;
        btn.setAttribute('role', 'radio');

        // ikon kotak-kotak kecil sesuai susunan foto
        const icon = document.createElement('span');
        icon.className = 'layout-icon';
        icon.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
        icon.style.aspectRatio = `${layout.cols} / ${layout.rows * (layout.cellAspect || 0.75)}`;
        for (let i = 0; i < layout.cols * layout.rows; i++) {
            icon.appendChild(document.createElement('span'));
        }

        const label = document.createElement('span');
        label.className = 'frame-label';
        label.innerText = layout.name;
        const count = document.createElement('span');
        count.className = 'layout-count';
        count.innerText = `${layoutShots(layout)} foto`;

        btn.append(icon, label, count);
        btn.addEventListener('click', () => {
            selectedLayoutId = layout.id;
            saveSetting('photoLayout', layout.id);
            markChecked(layoutList, 'layout', layout.id);
            buildThemeList(); // thumbnail tema ikut tata letak yang dipilih
            renderPreview();
        });
        layoutList.appendChild(btn);
    });
    markChecked(layoutList, 'layout', selectedLayoutId);
}

function buildFramePicker() {
    buildLayoutList();
    buildThemeList();
    buildTemplateList();
    updateLayoutState();
    renderPreview();
}

buildFramePicker();
framePreviewReady = true;

// Gambar template dimuat terpisah; perbarui thumbnail setelah gambarnya siap
loadTemplateImages(() => {
    buildTemplateList();
    if (isTemplateSelected()) renderPreview();
});

// Tunggu font siap supaya teks di thumbnail tidak pakai font cadangan
if (document.fonts && document.fonts.load) {
    Promise.all([
        document.fonts.load('700 40px "Oswald"'),
        document.fonts.load('40px "Patrick Hand"'),
        document.fonts.load('700 40px "Pixelify Sans"'),
        document.fonts.load('40px "VT323"')
    ]).then(buildFramePicker).catch(() => {});
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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !PHOTO_BUCKET) return;
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
        if (btn.closest('.frame-picker') || btn.closest('.idol-picker')) return;
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
        if (btn.closest('.theme-modal') || btn.closest('.frame-picker') || btn.closest('.idol-picker')) return;
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
