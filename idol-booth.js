// ==================== FOTO BARENG IDOL (idol.html) ====================
// Strip foto 3-4 shot. Tiap shot bisa diisi member + pose berbeda.
// Pratinjau di kiri digambar ulang terus, jadi kamera langsung terlihat di shot yang aktif.

const $ = id => document.getElementById(id);

// ---------- Pilihan ----------
const STRIP_STYLES = [
    { id: 'green', name: 'Hijau', bg: '#2f8a55', text: '#ffffff', outline: '#123d26', sub: '#d7f5e2', deco: 'squiggle' },
    { id: 'blue', name: 'Biru', bg: '#2459e0', text: '#ffffff', outline: '#0b2a7a', sub: '#dbe7ff', deco: 'sparkle' },
    { id: 'black', name: 'Hitam', bg: '#151515', text: '#ffffff', outline: '#000000', sub: '#bdbdbd', deco: 'stars' },
    { id: 'film', name: 'Film', bg: '#111111', text: '#f5a524', outline: '#000000', sub: '#f5a524', deco: 'film' },
    { id: 'pink', name: 'Pink', bg: '#f7a1cb', text: '#ffffff', outline: '#9d174d', sub: '#831843', deco: 'hearts' },
    { id: 'cream', name: 'Krem', bg: '#efe6d2', text: '#1a1a1a', outline: null, sub: '#5c5345', deco: 'dots' },
    // gaya dengan "kind" memakai desain sendiri (lihat STRIP_KINDS)
    { id: 'film35', name: 'Film 35mm', kind: 'film35', bg: '#121212', accent: '#ff8a1f' },
    { id: 'magazine', name: 'Majalah', kind: 'magazine', bg: '#f3efe7' },
    { id: 'blush', name: 'Blush', kind: 'blush', bg: '#ef9a8c' },
    { id: 'crumpled', name: 'Kertas Kusut', kind: 'crumpled', bg: '#d9d9dc' },
    { id: 'lavender', name: 'Lavender', kind: 'lavender', bg: '#d8c7ef' }
];

// css = filter canvas; tint = lapisan warna tipis di atas foto (opsional)
const FILTERS = [
    { id: 'natural', name: 'Natural', css: 'none' },
    { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.12)' },
    { id: 'film', name: 'Film', css: 'contrast(1.12) saturate(1.15) brightness(0.97)', tint: 'rgba(255, 214, 140, 0.14)' },
    { id: 'warm', name: 'Warm', css: 'saturate(1.15) brightness(1.03)', tint: 'rgba(255, 150, 60, 0.16)' },
    { id: 'cool', name: 'Cool', css: 'saturate(0.92) brightness(1.04)', tint: 'rgba(70, 130, 255, 0.16)' },
    { id: 'soft', name: 'Soft', css: 'brightness(1.08) contrast(0.88) saturate(0.9)', tint: 'rgba(255, 230, 240, 0.12)' }
];

const SIDES = [
    { id: 'left', name: 'Kiri' },
    { id: 'right', name: 'Kanan' },
    { id: 'both', name: 'Dua sisi' }
];

const COUNTS = [
    { id: '3', name: '3 foto' },
    { id: '4', name: '4 foto' }
];

const GROUP = IDOL_GROUPS[0];

// ---------- Ukuran strip ----------
const STRIP = { w: 600, slotX: 40, slotW: 520, slotH: 390, top: 64, gap: 28, bottom: 210, border: 10, radius: 22 };
const SLOT_TILT = [-1.2, 1, -0.8, 1.2];

function stripHeight(count) {
    return STRIP.top + count * STRIP.slotH + (count - 1) * STRIP.gap + STRIP.bottom;
}

// ---------- Simpan pengaturan ----------
function readSetting(key, fallback) {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch (e) {
        return fallback;
    }
}

function saveSetting(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) { /* localStorage tidak tersedia */ }
}

const findById = (list, id, fallback) => list.find(x => x.id === id) || fallback;

const state = {
    style: findById(STRIP_STYLES, readSetting('ibStyle', 'green'), STRIP_STYLES[0]).id,
    count: readSetting('ibCount', '4') === '3' ? 3 : 4,
    title: readSetting('ibTitle', ''),
    filter: findById(FILTERS, readSetting('ibFilter', 'natural'), FILTERS[0]).id,
    side: findById(SIDES, readSetting('ibSide', 'right'), SIDES[1]).id,
    size: Number(readSetting('ibSize', '95')) || 95,
    shift: Number(readSetting('ibShift', '0')) || 0,
    mirror: readSetting('ibMirror', '1') === '1',
    camera: true,
    current: 0,
    busy: false,
    // { member: id | 'custom' | null, pose: angka, custom: Image | null, photo: canvas | null }
    shots: []
};

function randomPose() {
    return Math.floor(Math.random() * 1000);
}

function resetShots() {
    state.shots = Array.from({ length: 4 }, (_, i) => ({
        member: GROUP.members[i % GROUP.members.length].id,
        pose: randomPose(),
        custom: null,
        photo: null
    }));
    state.current = 0;
}
resetShots();

// ---------- Gambar member ----------
let renderQueued = false;
function onImagesChanged() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
        renderQueued = false;
        buildWhoCard();
        markDirty();
    });
}

function memberById(id) {
    return GROUP.members.find(m => m.id === id) || null;
}

function readyPoses(memberId) {
    const member = memberById(memberId);
    if (!member) return [];
    return idolSrcs(GROUP, member).map(src => loadIdolImage(src, onImagesChanged)).filter(idolReady);
}

// Gambar member untuk satu shot; offset dipakai untuk sisi kedua di mode "Dua sisi"
function shotMemberImage(shot, offset = 0) {
    if (shot.member === 'custom') return shot.custom;
    if (!shot.member) return null;
    const poses = readyPoses(shot.member);
    if (!poses.length) return null;
    return poses[(shot.pose + offset) % poses.length];
}

// ---------- Kamera ----------
const video = $('ibVideo');
const cameraStatus = $('ibCameraStatus');
let stream = null;

function cameraReady() {
    return Boolean(stream && video.readyState >= 2 && video.videoWidth);
}

async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraStatus.innerText = 'Browser ini tidak mendukung kamera.';
        return;
    }
    cameraStatus.innerText = 'Menyalakan kamera...';
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false
        });
        video.srcObject = stream;
        await video.play();
        cameraStatus.innerText = 'Kamera siap. Pose di sebelah member!';
    } catch (err) {
        console.error('Kamera gagal:', err);
        stream = null;
        state.camera = false;
        updateToggles();
        cameraStatus.innerText = 'Kamera tidak bisa dibuka. Izinkan akses kamera di browser, lalu tekan "Kamera nyala".';
    }
    markDirty();
}

function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    video.srcObject = null;
    cameraStatus.innerText = 'Kamera mati.';
    markDirty();
}

// Foto dari kamera, sudah di-mirror sesuai pengaturan
function snapshot() {
    const c = document.createElement('canvas');
    c.width = video.videoWidth || 1280;
    c.height = video.videoHeight || 960;
    const ctx = c.getContext('2d');
    if (state.mirror) {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, c.width, c.height);
    return c;
}

// ---------- Menggambar strip ----------
function drawCover(ctx, src, x, y, w, h, flip) {
    const sw0 = src.videoWidth || src.width;
    const sh0 = src.videoHeight || src.height;
    if (!sw0 || !sh0) return;
    const scale = Math.max(w / sw0, h / sh0);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (sw0 - sw) / 2;
    const sy = (sh0 - sh) / 2;
    ctx.save();
    if (flip) {
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
    } else {
        ctx.drawImage(src, sx, sy, sw, sh, x, y, w, h);
    }
    ctx.restore();
}

// Member berdiri di bawah kotak; tinggi = size% kotak, lebar maks 62% kotak
function drawMember(ctx, img, x, y, w, h, side) {
    if (!img || !(img.naturalWidth || img.width)) return;
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    let ih = h * (state.size / 100);
    let iw = ih * (nw / nh);
    const maxW = w * 0.62;
    if (iw > maxW) {
        iw = maxW;
        ih = iw * (nh / nw);
    }
    const margin = w * 0.02;
    const shift = (state.shift / 100) * w;
    const ix = (side === 'left' ? x + margin : x + w - iw - margin) + shift;
    ctx.drawImage(img, ix, y + h - ih, iw, ih);
}

function drawDecor(ctx, style, W, H) {
    const rand = seededRandom(11);
    ctx.save();
    if (style.deco === 'film') {
        ctx.fillStyle = '#f4efe4';
        for (let y = 18; y < H - 20; y += 40) {
            roundRect(ctx, 9, y, 18, 24, 4);
            ctx.fill();
            roundRect(ctx, W - 27, y, 18, 24, 4);
            ctx.fill();
        }
    } else if (style.deco === 'squiggle') {
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < 14; i++) {
            const x = rand() * W;
            const y = rand() * H;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x + 8, y - 10, x + 14, y + 10, x + 22, y);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 26; i++) {
            ctx.beginPath();
            ctx.arc(rand() * W, rand() * H, 2 + rand() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (style.deco === 'sparkle') {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 18; i++) {
            sparkle(ctx, rand() * W, rand() * H, 5 + rand() * 9);
            ctx.fill();
        }
    } else if (style.deco === 'stars') {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(rand() * W, rand() * H, 0.8 + rand() * 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (style.deco === 'hearts') {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        for (let i = 0; i < 20; i++) {
            heartPath(ctx, rand() * W, rand() * H, 12 + rand() * 18);
            ctx.fill();
        }
    } else if (style.deco === 'dots') {
        ctx.fillStyle = 'rgba(26,26,26,0.1)';
        for (let x = 11; x < W; x += 22) {
            for (let y = 11; y < H; y += 22) {
                ctx.beginPath();
                ctx.arc(x, y, 1.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.restore();
}

function stripTitle() {
    const custom = state.title.trim();
    if (custom) return custom.toUpperCase();
    const used = new Set(state.shots.slice(0, state.count).map(s => s.member).filter(m => m && m !== 'custom'));
    if (used.size === 1) {
        const m = memberById([...used][0]);
        if (m) return m.name.toUpperCase();
    }
    return GROUP.name.toUpperCase();
}

// ---------- Jenis desain strip ----------
// Setiap jenis (kind) punya susunan kotak sendiri (geometry), latar (background),
// hiasan di dalam kotak foto (slotExtra, opsional) dan tulisan/stiker di atas semuanya (overlay).
// Kotak: { x, y, w, h, rot, border (bingkai putih), radius, outline (garis tipis, opsional) }

const SITE_DOMAIN = 'LIVE-PHOTO-GESTURE.VERCEL.APP';

function currentStyle() {
    return findById(STRIP_STYLES, state.style, STRIP_STYLES[0]);
}

// Cap tanggal oranye ala kamera analog, contoh: '26 11 02
function dateStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `'${String(d.getFullYear()).slice(-2)} ${pad(d.getMonth() + 1)} ${pad(d.getDate())}`;
}

function glowText(ctx, text, x, y, color, blur = 6) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// Teks dengan garis tepi (stiker)
function stickerText(ctx, text, x, y, font, fill, stroke, strokeWidth) {
    ctx.font = font;
    ctx.lineJoin = 'round';
    if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
}

function stackSlots(count, { x, w, h, top, gap }, extra = () => ({})) {
    return Array.from({ length: count }, (_, i) => ({
        x, y: top + i * (h + gap), w, h, rot: 0, border: 0, radius: 0, ...extra(i)
    }));
}

function slotsBottom(geo) {
    const last = geo.slots[geo.slots.length - 1];
    return last.y + last.h;
}

const MAGAZINE_CAPTIONS = ['bias wrecker', 'main character energy', 'core memory', 'too cute to handle'];

function magazineCaption(i) {
    if (i === 0) {
        const shot = state.shots[0];
        const m = shot && shot.member && shot.member !== 'custom' ? memberById(shot.member) : null;
        return m ? `with ${m.name}` : 'with my bias';
    }
    return MAGAZINE_CAPTIONS[(i - 1) % MAGAZINE_CAPTIONS.length];
}

function englishDate() {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
}

function shortDate() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${String(d.getFullYear()).slice(-2)}`;
}

// Kertas kusut: segitiga-segitiga abu dengan terang-gelap acak
function drawCrumpledPaper(ctx, W, H) {
    const rand = seededRandom(5);
    ctx.fillStyle = '#e7e7e9';
    ctx.fillRect(0, 0, W, H);
    const step = 90;
    const cols = Math.ceil(W / step) + 1;
    const rows = Math.ceil(H / step) + 1;
    const pts = [];
    for (let r = 0; r <= rows; r++) {
        pts.push([]);
        for (let c = 0; c <= cols; c++) {
            pts[r].push([c * step + (rand() - 0.5) * step * 0.8, r * step + (rand() - 0.5) * step * 0.8]);
        }
    }
    const tri = (a, b, c) => {
        const shade = Math.floor(205 + rand() * 45);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.fill();
    };
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            tri(pts[r][c], pts[r][c + 1], pts[r + 1][c]);
            tri(pts[r][c + 1], pts[r + 1][c + 1], pts[r + 1][c]);
        }
    }
    // lipatan tipis
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo(rand() * W, rand() * H);
        ctx.lineTo(rand() * W, rand() * H);
        ctx.stroke();
    }
}

function drawBarcode(ctx, x, y, w, h) {
    const rand = seededRandom(3);
    let cx = x;
    ctx.fillStyle = '#1a1a1a';
    while (cx < x + w) {
        const bw = 1 + Math.floor(rand() * 4);
        if (rand() > 0.35) ctx.fillRect(cx, y, bw, h);
        cx += bw + 1 + Math.floor(rand() * 3);
    }
}

const STRIP_KINDS = {
    // strip warna dengan kotak miring berbingkai putih + nama besar di bawah
    classic: {
        placeholder: ['#ece8e0', '#e2ddd3'],
        geometry(count) {
            const slots = Array.from({ length: count }, (_, i) => ({
                x: STRIP.slotX,
                y: STRIP.top + i * (STRIP.slotH + STRIP.gap),
                w: STRIP.slotW,
                h: STRIP.slotH,
                rot: SLOT_TILT[i],
                border: STRIP.border,
                radius: STRIP.radius
            }));
            return { W: STRIP.w, H: stripHeight(count), slots };
        },
        background(ctx, geo, style) {
            ctx.fillStyle = style.bg;
            ctx.fillRect(0, 0, geo.W, geo.H);
            drawDecor(ctx, style, geo.W, geo.H);
        },
        overlay(ctx, geo, style, title) {
            const base = slotsBottom(geo);
            const W = geo.W;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.font = fitFont(ctx, title, 400, '"Archivo Black", "Oswald", sans-serif', 104, 500);
            if (style.outline) {
                ctx.lineJoin = 'round';
                ctx.lineWidth = 12;
                ctx.strokeStyle = style.outline;
                ctx.strokeText(title, W / 2, base + 128);
            }
            ctx.fillStyle = style.text;
            ctx.fillText(title, W / 2, base + 128);

            ctx.font = '500 20px "Oswald", sans-serif';
            setSpacing(ctx, 5);
            ctx.fillStyle = style.sub;
            ctx.fillText(`${GROUP.name} · ${todayText('.')}`, W / 2, base + 172);
            setSpacing(ctx, 0);
        }
    },

    // film 35mm: lubang film, nomor frame, cap tanggal oranye
    film35: {
        placeholder: ['#ece8e0', '#e2ddd3'],
        geometry(count) {
            const slots = stackSlots(count, { x: 66, w: 468, h: 392, top: 84, gap: 38 }, () => ({ radius: 3 }));
            return { W: 600, H: 84 + count * 392 + (count - 1) * 38 + 80, slots };
        },
        background(ctx, geo, style) {
            ctx.fillStyle = style.bg;
            ctx.fillRect(0, 0, geo.W, geo.H);
            ctx.fillStyle = '#f2ede2';
            for (let y = 14; y < geo.H - 18; y += 34) {
                roundRect(ctx, 14, y, 24, 16, 4);
                ctx.fill();
                roundRect(ctx, geo.W - 38, y, 24, 16, 4);
                ctx.fill();
            }
        },
        slotExtra(ctx, ix, iy, iw, ih, i, style) {
            ctx.font = '700 26px "VT323", "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'alphabetic';
            setSpacing(ctx, 2);
            glowText(ctx, dateStamp(), ix + iw - 14, iy + ih - 14, style.accent);
            setSpacing(ctx, 0);
        },
        overlay(ctx, geo, style, title) {
            const accent = style.accent;
            const W = geo.W;
            ctx.textBaseline = 'alphabetic';

            ctx.font = '600 17px "Oswald", sans-serif';
            ctx.textAlign = 'center';
            setSpacing(ctx, 5);
            glowText(ctx, `LIVE 400 · ${title}`, W / 2, 50, accent);

            ctx.font = '700 15px "Oswald", sans-serif';
            ctx.textAlign = 'left';
            setSpacing(ctx, 1);
            geo.slots.forEach((slot, i) => {
                const ty = slot.y - 10;
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.moveTo(slot.x - 14, ty - 11);
                ctx.lineTo(slot.x - 5, ty - 6);
                ctx.lineTo(slot.x - 14, ty - 1);
                ctx.closePath();
                ctx.fill();
                glowText(ctx, `${24 + i}A`, slot.x + 2, ty, accent);
            });

            ctx.font = '600 16px "Oswald", sans-serif';
            ctx.textAlign = 'center';
            setSpacing(ctx, 5);
            glowText(ctx, 'LIVE PHOTO GESTURE', W / 2, slotsBottom(geo) + 50, accent);
            setSpacing(ctx, 0);
        }
    },

    // gaya majalah: judul besar, nomor halaman & keterangan miring, barcode
    magazine: {
        placeholder: ['#e7e3da', '#dcd7cc'],
        geometry(count) {
            const step = 320 + 62;
            const slots = stackSlots(count, { x: 40, w: 520, h: 320, top: 210, gap: 62 }, () => ({ outline: '#1a1a1a' }));
            return { W: 600, H: 210 + count * step - 62 + 50 + 110, slots };
        },
        background(ctx, geo, style) {
            ctx.fillStyle = style.bg;
            ctx.fillRect(0, 0, geo.W, geo.H);
        },
        overlay(ctx, geo, style, title) {
            const W = geo.W;
            const ink = '#141414';
            ctx.textBaseline = 'alphabetic';

            // judul
            ctx.textAlign = 'center';
            ctx.font = fitFont(ctx, title, 400, '"Archivo Black", sans-serif', 124, 520);
            ctx.fillStyle = ink;
            ctx.fillText(title, W / 2, 140);

            ctx.fillStyle = ink;
            ctx.fillRect(40, 162, 520, 2);

            ctx.font = '700 13px "Space Mono", monospace';
            setSpacing(ctx, 2);
            ctx.textAlign = 'left';
            ctx.fillText('ISSUE 01', 40, 190);
            ctx.textAlign = 'center';
            ctx.fillText(GROUP.name, W / 2 - 20, 190);
            ctx.textAlign = 'right';
            ctx.fillText(englishDate(), 560, 190);
            setSpacing(ctx, 0);

            // nomor & keterangan di bawah tiap foto
            const total = geo.slots.length;
            geo.slots.forEach((slot, i) => {
                const y = slot.y + slot.h + 30;
                ctx.textAlign = 'left';
                ctx.font = '700 14px "Space Mono", monospace';
                ctx.fillStyle = ink;
                ctx.fillText(`${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, slot.x, y);
                ctx.textAlign = 'right';
                ctx.font = 'italic 22px "Playfair Display", Georgia, serif';
                ctx.fillText(magazineCaption(i), slot.x + slot.w, y + 2);
            });

            // barcode & alamat situs
            const by = slotsBottom(geo) + 80;
            drawBarcode(ctx, 40, by - 34, 120, 40);
            ctx.textAlign = 'right';
            ctx.font = '700 14px "Oswald", sans-serif';
            setSpacing(ctx, 1);
            ctx.fillStyle = ink;
            ctx.fillText(SITE_DOMAIN, 560, by);
            setSpacing(ctx, 0);
        }
    },

    // gradasi pink-koral, kotak bulat berbingkai putih, nama di kotak transparan
    blush: {
        placeholder: ['#ece8e0', '#e2ddd3'],
        geometry(count) {
            const slots = stackSlots(count, { x: 34, w: 532, h: 340, top: 82, gap: 20 }, () => ({ border: 5, radius: 18 }));
            const pillY = 82 + count * 340 + (count - 1) * 20 + 22;
            return { W: 600, H: pillY + 130 + 34, slots, pillY };
        },
        background(ctx, geo) {
            const g = ctx.createLinearGradient(0, 0, 0, geo.H);
            g.addColorStop(0, '#e8897c');
            g.addColorStop(0.5, '#f8d9d5');
            g.addColorStop(1, '#e67f72');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, geo.W, geo.H);
            const glow = ctx.createRadialGradient(geo.W / 2, geo.H / 2, 40, geo.W / 2, geo.H / 2, geo.H * 0.45);
            glow.addColorStop(0, 'rgba(255,255,255,0.45)');
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, geo.W, geo.H);
            // butiran halus
            const rand = seededRandom(9);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            for (let i = 0; i < 900; i++) ctx.fillRect(rand() * geo.W, rand() * geo.H, 1.5, 1.5);
        },
        overlay(ctx, geo, style, title) {
            const W = geo.W;
            const red = '#6b1414';
            ctx.textBaseline = 'alphabetic';
            ctx.font = '700 15px "Oswald", sans-serif';
            setSpacing(ctx, 3);
            ctx.fillStyle = red;
            ctx.textAlign = 'left';
            ctx.fillText(`${GROUP.name} PHOTOBOOTH`, 34, 52);
            ctx.textAlign = 'right';
            ctx.fillText(shortDate(), 566, 52);
            setSpacing(ctx, 0);

            const y = geo.pillY;
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            roundRect(ctx, 34, y, 532, 130, 22);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = red;
            ctx.font = fitFont(ctx, title, 400, '"Archivo Black", sans-serif', 78, 480);
            ctx.fillText(title, W / 2, y + 78);
            ctx.font = '700 14px "Oswald", sans-serif';
            setSpacing(ctx, 4);
            ctx.fillText(SITE_DOMAIN, W / 2, y + 108);
            setSpacing(ctx, 0);
        }
    },

    // strip hitam di atas kertas kusut, dengan stiker-stiker
    crumpled: {
        placeholder: ['#ece8e0', '#e2ddd3'],
        geometry(count) {
            const slots = stackSlots(count, { x: 166, w: 388, h: 290, top: 112, gap: 14 });
            const stripTop = 96;
            const stripBottom = 112 + count * 290 + (count - 1) * 14 + 72;
            return { W: 720, H: stripBottom + 150, slots, strip: { x: 150, y: stripTop, w: 420, h: stripBottom - stripTop } };
        },
        background(ctx, geo) {
            drawCrumpledPaper(ctx, geo.W, geo.H);
            const s = geo.strip;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.35)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 6;
            ctx.fillStyle = '#1b1b1d';
            ctx.fillRect(s.x, s.y, s.w, s.h);
            ctx.restore();
        },
        overlay(ctx, geo, style, title) {
            const s = geo.strip;
            const slots = geo.slots;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';

            // logo di bawah strip
            ctx.font = '400 30px "Archivo Black", sans-serif';
            setSpacing(ctx, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(GROUP.name, s.x + s.w / 2, s.y + s.h - 24);
            setSpacing(ctx, 0);

            // stiker "Best DAY ever!"
            ctx.save();
            ctx.translate(geo.W - 108, 96);
            ctx.rotate(-0.28);
            stickerText(ctx, 'Best', 0, -6, '54px "Patrick Hand", cursive', '#2bb3b1', '#ffffff', 12);
            stickerText(ctx, 'DAY', 6, 44, '400 46px "Archivo Black", sans-serif', '#ffd02a', '#ffffff', 12);
            stickerText(ctx, 'ever!', 10, 92, '54px "Patrick Hand", cursive', '#2bb3b1', '#ffffff', 12);
            ctx.restore();

            // tulisan "friends" di foto kedua
            if (slots[1]) {
                ctx.save();
                ctx.translate(slots[1].x + 120, slots[1].y + slots[1].h - 70);
                ctx.rotate(-0.06);
                stickerText(ctx, 'friends', 0, 0, '76px "Patrick Hand", cursive', '#ffd84d', 'rgba(60,40,0,0.35)', 4);
                ctx.restore();
            }

            // medali di foto ketiga
            if (slots[2]) {
                const mx = slots[2].x + slots[2].w * 0.6;
                const my = slots[2].y + slots[2].h * 0.62;
                ctx.fillStyle = '#d62828';
                ctx.beginPath();
                ctx.moveTo(mx - 22, my - 46);
                ctx.lineTo(mx - 6, my - 46);
                ctx.lineTo(mx + 4, my - 14);
                ctx.lineTo(mx - 12, my - 14);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(mx + 22, my - 46);
                ctx.lineTo(mx + 6, my - 46);
                ctx.lineTo(mx - 4, my - 14);
                ctx.lineTo(mx + 12, my - 14);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#f2b51d';
                ctx.beginPath();
                ctx.arc(mx, my, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#c98a0c';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 20px "Oswald", sans-serif';
                ctx.textBaseline = 'middle';
                ctx.fillText('1', mx, my + 1);
                ctx.textBaseline = 'alphabetic';
            }

            // stiker bulat "LOVE LOVE"
            const cx = 120;
            const cy = geo.H - 130;
            ctx.fillStyle = '#f6b81c';
            ctx.beginPath();
            ctx.arc(cx, cy, 96, 0, Math.PI * 2);
            ctx.fill();
            stickerText(ctx, 'LOVE', cx, cy - 6, '400 46px "Archivo Black", sans-serif', '#ffffff', '#5a5a5a', 6);
            stickerText(ctx, 'LOVE', cx, cy + 48, '400 46px "Archivo Black", sans-serif', '#ffffff', '#5a5a5a', 6);
        }
    },

    // strip lavender bergaya photo studio, tulisan vertikal di samping
    lavender: {
        placeholder: ['#ffffff', '#f7f4fb'],
        geometry(count) {
            const slots = stackSlots(count, { x: 70, w: 500, h: 330, top: 96, gap: 10 });
            return { W: 600, H: 96 + count * 330 + (count - 1) * 10 + 58, slots };
        },
        background(ctx, geo, style) {
            ctx.fillStyle = style.bg;
            ctx.fillRect(0, 0, geo.W, geo.H);
        },
        overlay(ctx, geo, style, title) {
            const W = geo.W;
            const ink = '#141414';
            ctx.textBaseline = 'alphabetic';

            // logo kiri atas
            ctx.textAlign = 'left';
            ctx.fillStyle = ink;
            ctx.font = '400 34px "Archivo Black", sans-serif';
            ctx.fillText(GROUP.name, 70, 58);
            ctx.font = '700 10px "Oswald", sans-serif';
            setSpacing(ctx, 2);
            ctx.fillText('LIVE PHOTO GESTURE', 72, 76);
            setSpacing(ctx, 0);

            // label kanan atas
            ctx.font = '600 17px "Oswald", sans-serif';
            const label = 'live photo';
            const lw = ctx.measureText(label).width + 30;
            ctx.fillStyle = ink;
            roundRect(ctx, 570 - lw, 32, lw, 32, 16);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(label, 570 - lw / 2, 54);

            // tulisan vertikal di sisi kiri
            ctx.save();
            ctx.translate(40, geo.H / 2);
            ctx.rotate(Math.PI / 2);
            ctx.font = '700 15px "Oswald", sans-serif';
            setSpacing(ctx, 3);
            ctx.fillStyle = ink;
            ctx.textAlign = 'center';
            ctx.fillText(`${GROUP.name} · ${title} · LIVE PHOTO GESTURE`, 0, 0);
            setSpacing(ctx, 0);
            ctx.restore();

            // baris bawah
            const by = geo.H - 22;
            ctx.font = '600 11px "Oswald", sans-serif';
            ctx.fillStyle = ink;
            ctx.textAlign = 'left';
            ctx.fillText('© LIVE PHOTO GESTURE', 70, by);
            ctx.textAlign = 'right';
            ctx.font = '500 12px "Oswald", sans-serif';
            ctx.fillText('keep the moment at', 470, by);
            ctx.font = '700 14px "Oswald", sans-serif';
            ctx.fillText('live photo', 570, by);
        }
    }
};

function stripKind(style) {
    return STRIP_KINDS[style.kind] || STRIP_KINDS.classic;
}

function stripGeometry(style, count) {
    return stripKind(style).geometry(count);
}

function drawSlot(ctx, slot, i, live, style, kind, filter) {
    const shot = state.shots[i];
    const { x, y, w, h, border: b, radius: r } = slot;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (slot.rot) ctx.rotate((slot.rot * Math.PI) / 180);

    // bayangan + bingkai putih
    if (b > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        roundRect(ctx, -w / 2 + 4, -h / 2 + 6, w, h, r);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, -w / 2, -h / 2, w, h, r);
        ctx.fill();
    }

    // isi kotak
    const ix = -w / 2 + b;
    const iy = -h / 2 + b;
    const iw = w - b * 2;
    const ih = h - b * 2;
    const ir = Math.max(r - b, 0);
    ctx.save();
    if (ir > 0) roundRect(ctx, ix, iy, iw, ih, ir);
    else {
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
    }
    ctx.clip();

    const showLive = live && i === state.current && !shot.photo && state.camera && cameraReady();
    const source = shot.photo || (showLive ? video : null);

    if (filter.css !== 'none') ctx.filter = filter.css;
    if (source) {
        drawCover(ctx, source, ix, iy, iw, ih, showLive && state.mirror);
    } else {
        const [c1, c2] = kind.placeholder;
        const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
        g.addColorStop(0, c1);
        g.addColorStop(1, c2);
        ctx.fillStyle = g;
        ctx.fillRect(ix, iy, iw, ih);
        // nomor shot di sisi yang kosong
        const hasMember = Boolean(shotMemberImage(shot));
        let nx = ix + iw / 2;
        if (hasMember && state.side === 'right') nx = ix + iw * 0.3;
        if (hasMember && state.side === 'left') nx = ix + iw * 0.7;
        ctx.font = '700 110px "Archivo Black", "Oswald", sans-serif';
        ctx.fillStyle = '#b9b2a4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), nx, iy + ih / 2 + 6);
    }

    const main = shotMemberImage(shot);
    if (state.side === 'both') {
        drawMember(ctx, main, ix, iy, iw, ih, 'right');
        drawMember(ctx, shotMemberImage(shot, 1), ix, iy, iw, ih, 'left');
    } else {
        drawMember(ctx, main, ix, iy, iw, ih, state.side);
    }
    ctx.filter = 'none';

    if (filter.tint && source) {
        ctx.fillStyle = filter.tint;
        ctx.fillRect(ix, iy, iw, ih);
    }
    if (kind.slotExtra) kind.slotExtra(ctx, ix, iy, iw, ih, i, style);
    ctx.restore();

    if (slot.outline) {
        ctx.strokeStyle = slot.outline;
        ctx.lineWidth = 2;
        ctx.strokeRect(ix, iy, iw, ih);
    }

    // tanda shot aktif di pratinjau
    if (live && i === state.current) {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 6;
        roundRect(ctx, ix + 3, iy + 3, iw - 6, ih - 6, ir);
        ctx.stroke();
    }
    ctx.restore();
}

// live = tampilkan kamera di shot aktif (untuk pratinjau)
function renderStrip(ctx, live) {
    const style = currentStyle();
    const kind = stripKind(style);
    const filter = findById(FILTERS, state.filter, FILTERS[0]);
    const geo = kind.geometry(state.count);

    ctx.save();
    kind.background(ctx, geo, style);
    ctx.restore();

    geo.slots.forEach((slot, i) => drawSlot(ctx, slot, i, live, style, kind, filter));

    ctx.save();
    kind.overlay(ctx, geo, style, stripTitle());
    ctx.restore();
}

// ---------- Pratinjau ----------
const preview = $('ibPreview');
const previewCtx = preview.getContext('2d');
let dirty = true;

function markDirty() {
    dirty = true;
}

function drawPreview() {
    const { W, H } = stripGeometry(currentStyle(), state.count);
    if (preview.width !== W || preview.height !== H) {
        preview.width = W;
        preview.height = H;
    }
    renderStrip(previewCtx, true);
}

let lastFrame = 0;
function loop(t) {
    const liveNeeded = state.camera && cameraReady() && !state.shots[state.current].photo;
    // kamera digambar ~24 kali per detik; selain itu hanya saat ada perubahan
    if (dirty || (liveNeeded && t - lastFrame > 40)) {
        drawPreview();
        dirty = false;
        lastFrame = t;
    }
    requestAnimationFrame(loop);
}

// ---------- Tombol & pilihan ----------
function makeChip(label, checked, onClick, attrs = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ib-chip';
    btn.innerText = label;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', checked);
    Object.entries(attrs).forEach(([k, v]) => btn.setAttribute(k, v));
    btn.addEventListener('click', onClick);
    return btn;
}

function buildChoiceList(container, items, current, onPick) {
    container.innerHTML = '';
    items.forEach(item => {
        container.appendChild(makeChip(item.name, item.id === current, () => onPick(item.id), { 'data-id': item.id }));
    });
}

function buildStyleList() {
    buildChoiceList($('ibStyleList'), STRIP_STYLES, state.style, id => {
        state.style = id;
        saveSetting('ibStyle', id);
        buildStyleList();
        markDirty();
    });
    // contoh warna di tiap tombol
    $('ibStyleList').querySelectorAll('.ib-chip').forEach(btn => {
        const s = findById(STRIP_STYLES, btn.dataset.id);
        const dot = document.createElement('span');
        dot.className = 'ib-swatch';
        dot.style.background = s.bg;
        btn.prepend(dot);
    });
}

function buildCountList() {
    buildChoiceList($('ibCountList'), COUNTS, String(state.count), id => {
        state.count = Number(id);
        saveSetting('ibCount', id);
        if (state.current >= state.count) state.current = state.count - 1;
        buildCountList();
        refreshShootUI();
    });
}

function buildFilterList() {
    buildChoiceList($('ibFilterList'), FILTERS, state.filter, id => {
        state.filter = id;
        saveSetting('ibFilter', id);
        buildFilterList();
        markDirty();
    });
}

function buildSideList() {
    buildChoiceList($('ibSideList'), SIDES, state.side, id => {
        state.side = id;
        saveSetting('ibSide', id);
        buildSideList();
        markDirty();
    });
}

function buildShotTabs() {
    const tabs = $('ibShotTabs');
    tabs.innerHTML = '';
    for (let i = 0; i < state.count; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ib-shot-tab' + (state.shots[i].photo ? ' is-done' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', i === state.current);
        btn.innerText = `Shot ${i + 1}`;
        btn.addEventListener('click', () => {
            state.current = i;
            refreshShootUI();
        });
        tabs.appendChild(btn);
    }
}

function buildWhoCard() {
    const shot = state.shots[state.current];
    $('ibWhoTitle').innerText = `Siapa di shot ${state.current + 1}`;

    const list = $('ibMemberList');
    list.innerHTML = '';
    GROUP.members.forEach(m => {
        const ready = readyPoses(m.id).length > 0;
        const chip = makeChip(m.name, shot.member === m.id, () => {
            shot.member = m.id;
            shot.custom = null;
            buildWhoCard();
            markDirty();
        });
        chip.disabled = !ready;
        list.appendChild(chip);
    });
    if (shot.custom) {
        list.appendChild(makeChip('Foto upload', shot.member === 'custom', () => {
            shot.member = 'custom';
            buildWhoCard();
            markDirty();
        }));
    }

    // pilihan pose member yang dipilih
    const grid = $('ibPoseGrid');
    grid.innerHTML = '';
    if (shot.member && shot.member !== 'custom') {
        const poses = readyPoses(shot.member);
        const active = poses.length ? shot.pose % poses.length : -1;
        poses.forEach((img, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ib-pose';
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', idx === active);
            btn.setAttribute('aria-label', `Pose ${idx + 1}`);
            const el = document.createElement('img');
            el.src = img.src;
            el.alt = '';
            btn.appendChild(el);
            btn.addEventListener('click', () => {
                shot.pose = idx;
                buildWhoCard();
                markDirty();
            });
            grid.appendChild(btn);
        });
    }
    grid.hidden = grid.children.length === 0;
    $('ibNobodyBtn').setAttribute('aria-pressed', shot.member === null);
}

function updateToggles() {
    $('ibMirrorBtn').setAttribute('aria-pressed', state.mirror);
    $('ibCameraBtn').setAttribute('aria-pressed', state.camera);
    $('ibCameraBtn').innerText = state.camera ? 'Kamera nyala' : 'Kamera mati';
}

function allShotsDone() {
    return state.shots.slice(0, state.count).every(s => s.photo);
}

function refreshShootUI() {
    buildShotTabs();
    buildWhoCard();
    const shot = state.shots[state.current];
    const n = state.current + 1;
    $('ibShootBtn').innerText = shot.photo ? `Ulangi shot ${n}` : `Ambil shot ${n}`;

    const next = state.shots.slice(0, state.count).findIndex(s => !s.photo);
    $('ibNextUp').innerText = next === -1
        ? 'Semua shot sudah diambil. Simpan stripnya di langkah 03.'
        : `Berikutnya: shot ${next + 1}.`;

    const done = allShotsDone();
    $('ibDownloadBtn').disabled = !done;
    $('ibShareBtn').disabled = !done;
    $('ibSaveHint').innerText = done
        ? 'Strip siap! Download atau share sekarang.'
        : 'Ambil semua shot dulu, lalu simpan stripnya.';
    $('ibAutoBtn').disabled = done;
    markDirty();
}

// ---------- Ambil foto ----------
const countdownOverlay = $('countdownOverlay');
const countdownNumber = $('countdownNumber');
const countdownLabel = $('countdownLabel');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function flashEffect() {
    const flash = document.createElement('div');
    flash.className = 'ib-flash';
    document.body.appendChild(flash);
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 300);
    }, 80);
}

async function captureShot(index) {
    if (!state.camera || !cameraReady()) {
        alert('Kamera belum siap. Pastikan kamera nyala dan izinnya sudah diberikan.');
        return false;
    }
    state.current = index;
    refreshShootUI();
    // di layar kecil pratinjau ada di atas; gulung ke sana supaya bisa lihat pose sendiri
    if (window.matchMedia('(max-width: 820px)').matches) {
        preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    countdownLabel.innerText = `Shot ${index + 1}`;
    countdownOverlay.style.display = 'flex';
    for (let i = 3; i >= 1; i--) {
        countdownNumber.innerText = i;
        countdownNumber.style.animation = 'none';
        countdownNumber.offsetHeight; // ulang animasi
        countdownNumber.style.animation = 'pulse 0.5s ease-in-out';
        await sleep(1000);
    }
    countdownOverlay.style.display = 'none';
    state.shots[index].photo = snapshot();
    flashEffect();

    const next = state.shots.slice(0, state.count).findIndex(s => !s.photo);
    if (next !== -1) state.current = next;
    refreshShootUI();
    return true;
}

async function shootCurrent() {
    if (state.busy) return;
    state.busy = true;
    try {
        await captureShot(state.current);
    } finally {
        state.busy = false;
    }
}

async function shootAll() {
    if (state.busy) return;
    state.busy = true;
    try {
        for (let i = 0; i < state.count; i++) {
            if (state.shots[i].photo) continue;
            const ok = await captureShot(i);
            if (!ok) break;
            await sleep(900); // jeda ganti pose
        }
    } finally {
        state.busy = false;
    }
}

// ---------- Simpan ----------
function renderFinal() {
    const scale = 2; // hasil 1200px lebar
    const c = document.createElement('canvas');
    const { W, H } = stripGeometry(currentStyle(), state.count);
    c.width = W * scale;
    c.height = H * scale;
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    renderStrip(ctx, false);
    return c;
}

function finalBlob() {
    return new Promise((resolve, reject) => {
        try {
            renderFinal().toBlob(b => (b ? resolve(b) : reject(new Error('Gagal membuat gambar'))), 'image/jpeg', 0.92);
        } catch (err) {
            reject(err);
        }
    });
}

function fileName() {
    return `foto-bareng-${stripTitle().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.jpg`;
}

function saveFailed(err) {
    console.error(err);
    alert('Strip tidak bisa disimpan kalau halaman dibuka langsung dari file. Buka lewat server (Live Server atau situs Vercel).');
}

async function downloadStrip() {
    try {
        const blob = await finalBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName();
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
        saveFailed(err);
    }
}

async function shareStrip() {
    try {
        const blob = await finalBlob();
        const file = new File([blob], fileName(), { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Foto bareng idol' });
        } else {
            alert('Share tidak didukung di browser ini, jadi stripnya di-download saja.');
            downloadStrip();
        }
    } catch (err) {
        if (err && err.name === 'AbortError') return; // share dibatalkan
        saveFailed(err);
    }
}

// ---------- Event ----------
$('ibTitleInput').value = state.title;
$('ibTitleInput').addEventListener('input', e => {
    state.title = e.target.value;
    saveSetting('ibTitle', state.title);
    markDirty();
});

$('ibSize').value = state.size;
$('ibSize').addEventListener('input', e => {
    state.size = Number(e.target.value);
    saveSetting('ibSize', String(state.size));
    markDirty();
});

$('ibShift').value = state.shift;
$('ibShift').addEventListener('input', e => {
    state.shift = Number(e.target.value);
    saveSetting('ibShift', String(state.shift));
    markDirty();
});

$('ibNobodyBtn').addEventListener('click', () => {
    state.shots[state.current].member = null;
    buildWhoCard();
    markDirty();
});

$('ibUploadBtn').addEventListener('click', () => $('ibUploadInput').click());
$('ibUploadInput').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        const shot = state.shots[state.current];
        shot.custom = img;
        shot.member = 'custom';
        buildWhoCard();
        markDirty();
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
});

// member & pose shot ini dipakai di semua shot (posenya dibuat berbeda-beda)
$('ibApplyAllBtn').addEventListener('click', () => {
    const src = state.shots[state.current];
    state.shots.forEach((s, i) => {
        s.member = src.member;
        s.custom = src.custom;
        s.pose = src.pose + (i - state.current) + 1000;
    });
    buildWhoCard();
    markDirty();
});

$('ibShuffleBtn').addEventListener('click', () => {
    state.shots.forEach(s => { s.pose = randomPose(); });
    buildWhoCard();
    markDirty();
});

$('ibMirrorBtn').addEventListener('click', () => {
    state.mirror = !state.mirror;
    saveSetting('ibMirror', state.mirror ? '1' : '0');
    updateToggles();
    markDirty();
});

$('ibCameraBtn').addEventListener('click', () => {
    state.camera = !state.camera;
    updateToggles();
    if (state.camera) startCamera();
    else stopCamera();
});

$('ibShootBtn').addEventListener('click', shootCurrent);
$('ibAutoBtn').addEventListener('click', shootAll);
$('ibDownloadBtn').addEventListener('click', downloadStrip);
$('ibShareBtn').addEventListener('click', shareStrip);

$('ibChangeFrameBtn').addEventListener('click', () => {
    $('stepFrame').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('ibResetBtn').addEventListener('click', () => {
    if (state.busy) return;
    resetShots();
    refreshShootUI();
});

document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
    e.preventDefault();
    shootCurrent();
});

// ---------- Mulai ----------
buildStyleList();
buildCountList();
buildFilterList();
buildSideList();
updateToggles();
refreshShootUI();
requestAnimationFrame(loop);
startCamera();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(markDirty);
