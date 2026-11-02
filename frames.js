// ==================== BINGKAI FOTO ====================
// Bingkai = TEMA (warna, hiasan, tulisan) + TATA LETAK (jumlah & susunan foto).
// Semua digambar langsung di canvas, jadi tidak butuh file gambar.
//
// Ukuran hiasan memakai satuan "u" (u = 1 kalau lebar area foto 640px),
// supaya tema terlihat proporsional di tata letak mana pun.
//
// Menambah tata letak: tambahkan satu baris di LAYOUTS.
// Menambah tema: tambahkan satu objek di THEMES (lihat contoh di bawah).

// ---------- Tata letak ----------
// cols x rows = susunan kotak foto. gridWidth = lebar total area foto (px).
// cellAspect = tinggi/lebar tiap kotak (default 0.75 = 4:3).
// duplicate = kolom kedua mengulang foto kolom pertama (strip photobooth yang dipotong dua).
const LAYOUTS = [
    { id: '1', name: '1 Foto', cols: 1, rows: 1, gridWidth: 640 },
    { id: '2', name: '2 Foto', cols: 1, rows: 2, gridWidth: 560 },
    { id: 'strip3', name: 'Strip 3', cols: 1, rows: 3, gridWidth: 500 },
    { id: '2x2', name: '2 x 2', cols: 2, rows: 2, gridWidth: 900 },
    { id: '3x3', name: '3 x 3', cols: 3, rows: 3, gridWidth: 1000 },
    { id: 'double', name: 'Strip Ganda', cols: 2, rows: 3, gridWidth: 908, cellAspect: 1.08, duplicate: true }
];

// ---------- Alat bantu gambar ----------

// Random yang selalu sama hasilnya, supaya garis "goyang" tidak berubah tiap foto
function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

function todayText(sep = ' . ') {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}${sep}${pad(d.getMonth() + 1)}${sep}${d.getFullYear()}`;
}

function setSpacing(ctx, px) {
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

// Tulis teks di tengah; maxWidth membuat teks dipadatkan kalau terlalu panjang
function centerText(ctx, text, x, y, font, color, spacing = 0, maxWidth) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    setSpacing(ctx, spacing);
    const w = Math.min(ctx.measureText(text).width, maxWidth || Infinity);
    if (maxWidth) ctx.fillText(text, x, y, maxWidth);
    else ctx.fillText(text, x, y);
    setSpacing(ctx, 0);
    return w;
}

// Kecilkan font sampai teks muat di lebar tertentu
function fitFont(ctx, text, weight, family, maxSize, maxWidth) {
    let size = maxSize;
    do {
        ctx.font = `${weight} ${size}px ${family}`;
        size -= 2;
    } while (ctx.measureText(text).width > maxWidth && size > 10);
    return ctx.font;
}

// Garis kotak seperti digambar tangan
function sketchRect(ctx, x, y, w, h, rand, wobble = 3) {
    const j = () => (rand() - 0.5) * wobble * 2;
    ctx.beginPath();
    ctx.moveTo(x + j(), y + j());
    ctx.quadraticCurveTo(x + w / 2 + j(), y + j(), x + w + j(), y + j());
    ctx.quadraticCurveTo(x + w + j(), y + h / 2 + j(), x + w + j(), y + h + j());
    ctx.quadraticCurveTo(x + w / 2 + j(), y + h + j(), x + j(), y + h + j());
    ctx.quadraticCurveTo(x + j(), y + h / 2 + j(), x + j(), y + j());
    ctx.stroke();
}

function heartPath(ctx, cx, cy, size) {
    const s = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.7, cy - s * 1.4, cx, cy - s * 0.5);
    ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.4, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 0.9);
    ctx.closePath();
}

function starPath(ctx, cx, cy, outer, inner = outer * 0.45, points = 5) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / points) * i - Math.PI / 2;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
}

function sparkle(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - size);
    ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function strokeSlots(ctx, f, color, width, outset = 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    f.slots.forEach(s => ctx.strokeRect(s.x - outset, s.y - outset, s.w + outset * 2, s.h + outset * 2));
}

// ---------- Gambar piksel (8-bit) ----------
// Setiap huruf di grid = satu warna dari palette, titik = kosong
function pixelSprite(ctx, grid, palette, x, y, px) {
    grid.forEach((row, r) => {
        [...row].forEach((ch, c) => {
            const color = palette[ch];
            if (!color) return;
            ctx.fillStyle = color;
            ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), Math.ceil(px), Math.ceil(px));
        });
    });
}

function pixelSparkle(ctx, cx, cy, px, color = '#f7d774', core = '#fff3b0') {
    ctx.fillStyle = color;
    for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        ctx.globalAlpha = Math.abs(i) === 4 ? 0.45 : 1;
        ctx.fillRect(cx + i * px - px / 2, cy - px / 2, px, px);
        ctx.fillRect(cx - px / 2, cy + i * px - px / 2, px, px);
    }
    ctx.globalAlpha = 1;
    ctx.fillRect(cx - px * 1.5, cy - px / 2, px * 3, px);
    ctx.fillRect(cx - px / 2, cy - px * 1.5, px, px * 3);
    ctx.fillStyle = core;
    ctx.fillRect(cx - px / 2, cy - px / 2, px, px);
}

const SPRITES = {
    mushroom: {
        grid: [
            '.....KKKKKK.....',
            '...KKRRRRRRKK...',
            '..KRRWWRRRRRRK..',
            '.KRRWWWWRRWWRRK.',
            '.KRRWWWWRWWWWRK.',
            'KRRRRWWRRWWWWRRK',
            'KRWWRRRRRRWWRRRK',
            'KWWWWRRWWRRRRWWK',
            'KWWWRRWWWWRRWWWK',
            '.KKRRRWWWWRRRKK.',
            '...KKKKKKKKKK...',
            '...KSSSSSSSSK...',
            '...KSSKSSKSSK...',
            '...KSSSSSSSSK...',
            '....KKKKKKKK....'
        ],
        palette: { K: '#1d1d1d', R: '#d62828', W: '#f4f4f4', S: '#ffd6cc' }
    },
    critter: {
        grid: [
            '.KK......KK.',
            'KOOK....KOOK',
            'KOOOKKKKOOOK',
            '.KOOOOOOOOK.',
            '.KODDOODDOK.',
            'KOOOOOOOOOOK',
            'KOOODDDDOOOK',
            '.KOOOOOOOOK.',
            '.KOOOOOOOOK.',
            '..KOOKKOOK..',
            '..KOK..KOK..',
            '..KK....KK..'
        ],
        palette: { K: '#1d1d1d', O: '#f7a21b', D: '#e2541b' }
    },
    slime: {
        grid: [
            '....KKKK....',
            '..KKLLGGKK..',
            '.KLLGGGGGGK.',
            '.KLGKGGKGGK.',
            'KGGGGGGGGGGK',
            'KGGGGGGGGGNK',
            'KNGGGGGGGNNK',
            '.KKKKKKKKKK.'
        ],
        palette: { K: '#24324a', G: '#2ee66b', L: '#8dffb0', N: '#169a6a' }
    },
    cloud: {
        grid: [
            '.......BBBB..........',
            '.....BBWWWWBB........',
            '....BWWWWWWWWB.BBB...',
            '..BBWWWWWWWWWWBWWWB..',
            '.BWWWWWWWWWWWWWWWWWB.',
            'BWWWWlWWWWWWWWWlWWWWB',
            'BWlllWWWWWWllWWWllWWB',
            'BllllllllllllllllllllB'
        ],
        palette: { B: '#8fcaec', W: '#f5f8ff', l: '#cfe6f7' }
    }
};

function drawSprite(ctx, name, x, y, px, flip = false) {
    const sp = SPRITES[name];
    const grid = flip ? sp.grid.map(r => [...r].reverse().join('')) : sp.grid;
    pixelSprite(ctx, grid, sp.palette, x, y, px);
}

// ---------- Tema ----------
// padding = ruang di sekitar area foto (satuan u), boleh berupa fungsi(layout).
// gap = jarak antar foto (satuan u). filter = efek warna untuk foto (opsional).
// background(ctx, f) digambar di bawah foto, foreground(ctx, f) di atas foto.
// f berisi: width, height, u, grid {x,y,w,h}, slots [{x,y,w,h,shot,row,col}], layout.
const THEMES = [
    {
        id: 'none',
        name: 'Polos',
        padding: layout => (layout.cols * layout.rows === 1 ? 0 : 16),
        gap: 16,
        background(ctx, f) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, f.width, f.height);
        }
    },
    {
        id: 'polaroid',
        name: 'Polaroid',
        padding: { top: 40, right: 40, bottom: 170, left: 40 },
        gap: 16,
        background(ctx, f) {
            ctx.fillStyle = '#fbfaf5';
            ctx.fillRect(0, 0, f.width, f.height);
        },
        foreground(ctx, f) {
            const { u } = f;
            const cx = f.width / 2;
            const base = f.grid.y + f.grid.h;
            strokeSlots(ctx, f, 'rgba(0,0,0,0.15)', 2 * u);
            const tw = centerText(ctx, 'kenangan hari ini', cx, base + 90 * u,
                `${52 * u}px "Patrick Hand", cursive`, '#2b2b2b', 0, f.width - 160 * u);
            ctx.fillStyle = '#e25b7a';
            heartPath(ctx, cx + tw / 2 + 30 * u, base + 72 * u, 30 * u);
            ctx.fill();
            centerText(ctx, todayText(), cx, base + 138 * u, `${24 * u}px "Patrick Hand", cursive`, '#8a857a');
        }
    },
    {
        id: 'sketch',
        name: 'Sketsa',
        padding: { top: 80, right: 60, bottom: 160, left: 60 },
        gap: 28,
        background(ctx, f) {
            ctx.fillStyle = '#f7f4ec';
            ctx.fillRect(0, 0, f.width, f.height);
            ctx.fillStyle = 'rgba(26,26,26,0.1)';
            const step = 22 * f.u;
            for (let x = step / 2; x < f.width; x += step) {
                for (let y = step / 2; y < f.height; y += step) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1.2 * f.u, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        },
        foreground(ctx, f) {
            const { u, grid: g } = f;
            const rand = seededRandom(7);
            const cx = f.width / 2;
            const base = g.y + g.h;
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // garis tiap foto + garis luar
            ctx.lineWidth = 4 * u;
            f.slots.forEach(s => sketchRect(ctx, s.x, s.y, s.w, s.h, rand, 3 * u));
            ctx.lineWidth = 2 * u;
            sketchRect(ctx, g.x - 14 * u, g.y - 14 * u, g.w + 28 * u, g.h + 28 * u, rand, 5 * u);

            // selotip di pojok atas
            [[g.x + 30 * u, g.y - 4 * u, -0.6], [g.x + g.w - 30 * u, g.y - 4 * u, 0.6]].forEach(([x, y, r]) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(r);
                ctx.fillStyle = 'rgba(253,230,138,0.85)';
                ctx.fillRect(-55 * u, -16 * u, 110 * u, 32 * u);
                ctx.strokeStyle = 'rgba(26,26,26,0.25)';
                ctx.lineWidth = 1.5 * u;
                ctx.strokeRect(-55 * u, -16 * u, 110 * u, 32 * u);
                ctx.restore();
            });

            // judul + coretan bawah
            const tw = centerText(ctx, 'LIVE PHOTO GESTURE', cx, base + 68 * u,
                `700 ${46 * u}px "Oswald", sans-serif`, '#1a1a1a', 3 * u, f.width - 140 * u);
            ctx.lineWidth = 3 * u;
            ctx.strokeStyle = '#1a1a1a';
            const half = tw / 2;
            ctx.beginPath();
            ctx.moveTo(cx - half * 0.8, base + 86 * u);
            ctx.bezierCurveTo(cx - half * 0.3, base + 76 * u, cx + half * 0.3, base + 96 * u, cx + half * 0.8, base + 82 * u);
            ctx.stroke();
            centerText(ctx, todayText(), cx, base + 124 * u, `${22 * u}px "Patrick Hand", cursive`, '#4a4a4a');

            // doodle
            ctx.lineWidth = 2.5 * u;
            starPath(ctx, g.x / 2, base + 50 * u, 18 * u);
            ctx.stroke();
            starPath(ctx, f.width - g.x / 2, base + 70 * u, 14 * u);
            ctx.stroke();
            heartPath(ctx, g.x + 40 * u, base + 120 * u, 26 * u);
            ctx.stroke();
            ctx.fillStyle = '#1a1a1a';
            sparkle(ctx, g.x + g.w - 40 * u, base + 126 * u, 12 * u);
            ctx.fill();
            sparkle(ctx, cx, g.y / 2 - 4 * u, 10 * u);
            ctx.fill();
        }
    },
    {
        id: 'film',
        name: 'Film Strip',
        padding: { top: 80, right: 40, bottom: 80, left: 40 },
        gap: 20,
        background(ctx, f) {
            ctx.fillStyle = '#141414';
            ctx.fillRect(0, 0, f.width, f.height);
        },
        foreground(ctx, f) {
            const { u, grid: g } = f;
            // lubang film atas & bawah
            ctx.fillStyle = '#f7f4ec';
            for (let x = 18 * u; x < f.width - 20 * u; x += 46 * u) {
                roundRect(ctx, x, 16 * u, 24 * u, 30 * u, 5 * u);
                ctx.fill();
                roundRect(ctx, x, f.height - 46 * u, 24 * u, 30 * u, 5 * u);
                ctx.fill();
            }
            ctx.font = `600 ${18 * u}px "Oswald", sans-serif`;
            ctx.fillStyle = '#f5a524';
            ctx.textBaseline = 'middle';
            setSpacing(ctx, 3 * u);
            const right = g.x + g.w;
            ctx.textAlign = 'left';
            ctx.fillText('LIVE 400', g.x, 64 * u);
            ctx.fillText('12A', g.x, f.height - 64 * u);
            ctx.textAlign = 'right';
            ctx.fillText(`▸ ${todayText('.')}`, right, 64 * u);
            ctx.fillText('GESTURE ▸', right, f.height - 64 * u);
            setSpacing(ctx, 0);
        }
    },
    {
        id: 'vintage',
        name: 'Vintage',
        padding: { top: 120, right: 40, bottom: 170, left: 40 },
        gap: 20,
        filter: 'sepia(0.55) contrast(1.05) saturate(0.9)',
        background(ctx, f) {
            ctx.fillStyle = '#efe4cc';
            ctx.fillRect(0, 0, f.width, f.height);
        },
        foreground(ctx, f) {
            const { u, grid: g } = f;
            const ink = '#3b2a1a';
            const cx = f.width / 2;
            const base = g.y + g.h;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 4 * u;
            ctx.strokeRect(14 * u, 14 * u, f.width - 28 * u, f.height - 28 * u);
            ctx.lineWidth = 1.5 * u;
            ctx.strokeRect(24 * u, 24 * u, f.width - 48 * u, f.height - 48 * u);

            // hiasan berlian di pojok
            ctx.fillStyle = ink;
            const d = 24 * u;
            [[d, d], [f.width - d, d], [d, f.height - d], [f.width - d, f.height - d]].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.moveTo(x, y - 10 * u);
                ctx.lineTo(x + 10 * u, y);
                ctx.lineTo(x, y + 10 * u);
                ctx.lineTo(x - 10 * u, y);
                ctx.closePath();
                ctx.fill();
            });

            const tw = centerText(ctx, 'PHOTO BOOTH', cx, 86 * u, `700 ${50 * u}px "Oswald", sans-serif`,
                ink, 10 * u, f.width - 200 * u);
            ctx.lineWidth = 2 * u;
            const leftEnd = cx - tw / 2 - 22 * u;
            if (leftEnd - 44 * u > 20 * u) {
                [[44 * u, leftEnd], [cx + tw / 2 + 22 * u, f.width - 44 * u]].forEach(([a, b]) => {
                    ctx.beginPath();
                    ctx.moveTo(a, 66 * u);
                    ctx.lineTo(b, 66 * u);
                    ctx.stroke();
                });
            }

            strokeSlots(ctx, f, ink, 3 * u);

            ctx.fillStyle = ink;
            for (let i = -1; i <= 1; i++) {
                starPath(ctx, cx + i * 40 * u, base + 60 * u, 11 * u);
                ctx.fill();
            }
            centerText(ctx, todayText(), cx, base + 116 * u, `500 ${26 * u}px "Oswald", sans-serif`, ink, 6 * u);
        }
    },
    {
        id: 'love',
        name: 'Sarangheyo',
        padding: { top: 40, right: 40, bottom: 150, left: 40 },
        gap: 22,
        background(ctx, f) {
            const g = ctx.createLinearGradient(0, 0, 0, f.height);
            g.addColorStop(0, '#ffe1ec');
            g.addColorStop(1, '#ffc2d6');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, f.width, f.height);
            const rand = seededRandom(21);
            const count = Math.round((f.width * f.height) / (18000 * f.u * f.u));
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            for (let i = 0; i < count; i++) {
                heartPath(ctx, rand() * f.width, rand() * f.height, (12 + rand() * 20) * f.u);
                ctx.fill();
            }
        },
        foreground(ctx, f) {
            const { u, grid: g } = f;
            const cx = f.width / 2;
            const base = g.y + g.h;
            strokeSlots(ctx, f, '#ffffff', 10 * u, 5 * u);

            const tw = centerText(ctx, 'sarangheyo', cx, base + 86 * u, `${64 * u}px "Patrick Hand", cursive`,
                '#c2255c', 0, f.width - 220 * u);
            ctx.fillStyle = '#e64980';
            heartPath(ctx, cx - tw / 2 - 50 * u, base + 64 * u, 44 * u);
            ctx.fill();
            heartPath(ctx, cx + tw / 2 + 50 * u, base + 64 * u, 44 * u);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            sparkle(ctx, g.x + g.w - 20 * u, g.y + 32 * u, 18 * u);
            ctx.fill();
            sparkle(ctx, g.x + 30 * u, base - 40 * u, 14 * u);
            ctx.fill();
            centerText(ctx, todayText(), cx, base + 130 * u, `${24 * u}px "Patrick Hand", cursive`, '#a61e4d');
        }
    },
    {
        id: 'bw',
        name: 'Hitam Putih',
        padding: { top: 40, right: 40, bottom: 110, left: 40 },
        gap: 16,
        filter: 'grayscale(1) contrast(1.15)',
        background(ctx, f) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, f.width, f.height);
        },
        foreground(ctx, f) {
            const { u, grid: g } = f;
            const cx = f.width / 2;
            const base = g.y + g.h;
            strokeSlots(ctx, f, '#111', 3 * u);
            centerText(ctx, '— LIVE PHOTO GESTURE —', cx, base + 60 * u, `600 ${30 * u}px "Oswald", sans-serif`,
                '#111', 4 * u, f.width - 80 * u);
            centerText(ctx, todayText(), cx, base + 94 * u, `${18 * u}px "Oswald", sans-serif`, '#777', 4 * u);
        }
    },
    {
        id: 'pixel',
        name: 'Pixel Joy',
        padding: { top: 60, right: 42, bottom: 228, left: 42 },
        gap: 16,
        background(ctx, f) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, f.width, f.height);
            // biru muda di kotak foto (terlihat sebelum foto diambil)
            f.slots.forEach(s => {
                const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
                g.addColorStop(0, '#e3e8ff');
                g.addColorStop(1, '#c9d3ff');
                ctx.fillStyle = g;
                ctx.fillRect(s.x, s.y, s.w, s.h);
            });
        },
        foreground(ctx, f) {
            const { u, grid: g } = f;
            const right = g.x + g.w;
            const base = g.y + g.h;

            // awan di pojok bawah
            const cloudPx = 10.5 * u;
            drawSprite(ctx, 'cloud', -14 * u, f.height - 85 * u, cloudPx);
            drawSprite(ctx, 'cloud', f.width - 22 * cloudPx + 14 * u, f.height - 85 * u, cloudPx, true);

            // tulisan: satu per kolom untuk strip ganda, satu di tengah untuk lainnya
            const columns = f.layout.duplicate
                ? f.slots.filter(s => s.row === 0).map(s => ({ cx: s.x + s.w / 2, w: s.w }))
                : [{ cx: f.width / 2, w: g.w }];
            columns.forEach(({ cx, w }) => {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#0571cc';
                ctx.font = fitFont(ctx, 'frame', 700, '"Pixelify Sans", monospace', 105 * u, Math.min(275 * u, w - 20 * u));
                ctx.fillText('frame', cx, base + 107 * u);

                const label = 'YOUR JOY';
                ctx.font = `${37 * u}px "VT323", monospace`;
                setSpacing(ctx, 6 * u);
                const tw = ctx.measureText(label).width;
                ctx.fillStyle = '#c8fd01';
                ctx.fillRect(cx - tw / 2 - 18 * u, base + 125 * u, tw + 36 * u, 44 * u);
                ctx.fillStyle = '#0571cc';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, cx + 3 * u, base + 148 * u);
                setSpacing(ctx, 0);
            });

            // karakter piksel & kelip bintang, posisinya ikut tepi area foto
            drawSprite(ctx, 'critter', g.x - 21 * u, g.y - 39 * u, 7 * u);
            drawSprite(ctx, 'critter', right - 14 * u, g.y + 0.28 * g.h, 6.3 * u, true);
            drawSprite(ctx, 'mushroom', g.x - 37 * u, g.y + 0.255 * g.h, 8.5 * u);
            drawSprite(ctx, 'mushroom', right - 70 * u, g.y + 0.6 * g.h, 8.5 * u, true);
            f.slots.filter(s => s.row === f.layout.rows - 1).forEach(s => {
                drawSprite(ctx, 'slime', s.x - 21 * u, s.y + s.h - 49 * u, 5 * u);
            });

            pixelSparkle(ctx, right + 41 * u, g.y + 6 * u, 8.5 * u);
            pixelSparkle(ctx, right - 52 * u, g.y + 82 * u, 7 * u);
            pixelSparkle(ctx, g.x + 85 * u, g.y + 0.614 * g.h, 7.7 * u);
            pixelSparkle(ctx, g.x - 11 * u, g.y + 0.684 * g.h, 7 * u);
        }
    }
];

// ---------- Template gambar ----------
// Bingkai dari file gambar (folder frames/). Susunan fotonya sudah tetap,
// jadi pilihan tata letak tidak berlaku untuk template.
// Koordinat slot memakai ukuran gambar asli (width x height):
// cx, cy = titik tengah kotak foto, w/h = ukuran, rot = kemiringan (derajat), r = sudut bulat.
// Kotak dibuat sedikit lebih besar dari "AREA FOTO" supaya warna birunya tertutup rapi.
const TEMPLATES = [
    {
        id: 'tpl-strawberry',
        name: 'Strawberry',
        template: {
            src: 'frames/strawberry.jpg', width: 540, height: 960,
            slots: [
                { cx: 151.5, cy: 316.6, w: 212, h: 170, rot: -5.7, r: 22 },
                { cx: 164.5, cy: 466.0, w: 212, h: 170, rot: -4.6, r: 22 },
                { cx: 176.0, cy: 627.6, w: 212, h: 172, rot: -5.7, r: 22 },
                { cx: 415.5, cy: 390.0, w: 206, h: 212, rot: 17, r: 25 },
                { cx: 410.0, cy: 613.0, w: 210, h: 214, rot: 7, r: 25 }
            ]
        }
    },
    {
        id: 'tpl-cherry',
        name: 'Cherry Diary',
        template: {
            src: 'frames/cherry-diary.jpg', width: 540, height: 960,
            slots: [
                { cx: 331.5, cy: 411.0, w: 196, h: 192, rot: -3.5, r: 25 },
                { cx: 344.0, cy: 573.3, w: 196, h: 192, rot: -2.8, r: 25 },
                { cx: 355.5, cy: 743.5, w: 198, h: 200, rot: -3.0, r: 25 }
            ]
        }
    },
    {
        id: 'tpl-film',
        name: 'Kamera Film',
        template: {
            src: 'frames/kamera-film.jpg', width: 540, height: 960,
            slots: [
                { cx: 270.5, cy: 396.0, w: 150, h: 117 },
                { cx: 270.5, cy: 516.5, w: 150, h: 124 },
                { cx: 270.5, cy: 646.5, w: 150, h: 124 },
                { cx: 269.5, cy: 768.0, w: 152, h: 125 }
            ]
        }
    },
    {
        id: 'tpl-kamera-pink',
        name: 'Kamera Pink',
        template: {
            src: 'frames/kamera-pink.jpg', width: 540, height: 960,
            slots: [
                { cx: 380.0, cy: 418.0, w: 268, h: 322, r: 20 }
            ]
        }
    }
];

// Hasil foto template dibuat 2x ukuran gambar asli supaya foto tetap tajam
const TEMPLATE_SCALE = 2;
const TEMPLATE_LAYOUT = { id: 'template', name: 'Template', cols: 1, rows: 1 };
const templateImages = {};

// Muat gambar template; onLoad dipanggil setiap satu gambar selesai dimuat
function loadTemplateImages(onLoad) {
    TEMPLATES.forEach(t => {
        if (templateImages[t.id]) return;
        const img = new Image();
        img.onload = () => onLoad && onLoad(t);
        img.src = t.template.src;
        templateImages[t.id] = img;
    });
}

function getLayout(id) {
    return LAYOUTS.find(l => l.id === id) || LAYOUTS[0];
}

function getTheme(id) {
    return THEMES.find(t => t.id === id) || TEMPLATES.find(t => t.id === id) || THEMES[0];
}

function buildTemplateFrame(theme) {
    const T = theme.template;
    const k = TEMPLATE_SCALE;
    const slots = T.slots.map((s, i) => ({
        x: (s.cx - s.w / 2) * k,
        y: (s.cy - s.h / 2) * k,
        w: s.w * k,
        h: s.h * k,
        rot: s.rot || 0,
        radius: (s.r || 0) * k,
        row: i,
        col: 0,
        shot: i
    }));
    const width = T.width * k;
    const height = T.height * k;
    return {
        theme,
        layout: TEMPLATE_LAYOUT,
        isTemplate: true,
        name: theme.name,
        width,
        height,
        u: 1,
        grid: { x: 0, y: 0, w: width, h: height },
        slots,
        shots: slots.length,
        filter: theme.filter,
        background(ctx, f) {
            const img = templateImages[theme.id];
            if (img && img.complete && img.naturalWidth) {
                ctx.drawImage(img, 0, 0, f.width, f.height);
            } else {
                ctx.fillStyle = '#ece6d6';
                ctx.fillRect(0, 0, f.width, f.height);
            }
        }
    };
}

function layoutShots(layout) {
    return layout.duplicate ? layout.rows : layout.cols * layout.rows;
}

// Gabungkan tema + tata letak jadi satu bingkai siap pakai
function buildFrame(themeId, layoutId) {
    const theme = getTheme(themeId);
    if (theme.template) return buildTemplateFrame(theme);
    const layout = getLayout(layoutId);
    const u = layout.gridWidth / 640;

    const rawPad = typeof theme.padding === 'function' ? theme.padding(layout) : (theme.padding || 0);
    const pad = typeof rawPad === 'number'
        ? { top: rawPad, right: rawPad, bottom: rawPad, left: rawPad }
        : rawPad;

    const gap = Math.round((theme.gap ?? 16) * u);
    const cellW = (layout.gridWidth - gap * (layout.cols - 1)) / layout.cols;
    const cellH = cellW * (layout.cellAspect || 0.75);
    const gridH = cellH * layout.rows + gap * (layout.rows - 1);

    const grid = {
        x: Math.round(pad.left * u),
        y: Math.round(pad.top * u),
        w: layout.gridWidth,
        h: Math.round(gridH)
    };

    const slots = [];
    for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.cols; col++) {
            slots.push({
                x: Math.round(grid.x + col * (cellW + gap)),
                y: Math.round(grid.y + row * (cellH + gap)),
                w: Math.round(cellW),
                h: Math.round(cellH),
                row,
                col,
                shot: layout.duplicate ? row : row * layout.cols + col
            });
        }
    }

    return {
        theme,
        layout,
        name: `${theme.name} · ${layout.name}`,
        width: Math.round(grid.x + grid.w + pad.right * u),
        height: Math.round(grid.y + grid.h + pad.bottom * u),
        u,
        grid,
        slots,
        shots: layoutShots(layout),
        filter: theme.filter,
        background: theme.background,
        foreground: theme.foreground
    };
}

// drawPhoto(ctx, x, y, w, h, shotIndex) menggambar isi foto di kotak yang diberikan.
// scale < 1 dipakai untuk thumbnail supaya ringan.
function renderFramed(frame, drawPhoto, scale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(frame.width * scale));
    canvas.height = Math.max(1, Math.round(frame.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    if (frame.background) frame.background(ctx, frame);

    // Kotak foto bisa miring (rot) dan bersudut bulat (radius)
    frame.slots.forEach(slot => {
        ctx.save();
        ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
        if (slot.rot) ctx.rotate((slot.rot * Math.PI) / 180);
        const x = -slot.w / 2;
        const y = -slot.h / 2;
        if (slot.radius) {
            roundRect(ctx, x, y, slot.w, slot.h, slot.radius);
        } else {
            ctx.beginPath();
            ctx.rect(x, y, slot.w, slot.h);
        }
        ctx.clip();
        if (frame.filter) ctx.filter = frame.filter;
        drawPhoto(ctx, x, y, slot.w, slot.h, slot.shot);
        ctx.restore();
    });

    if (frame.foreground) {
        ctx.save();
        frame.foreground(ctx, frame);
        ctx.restore();
    }
    return canvas;
}

// Foto contoh untuk thumbnail & pratinjau
const SAMPLE_COLORS = [
    ['#9ec5e8', '#f3d9b1'], ['#ffb3c1', '#ffe5ec'], ['#b9f3c9', '#fdffb6'],
    ['#cdb4db', '#ffc8dd'], ['#a0c4ff', '#caffbf'], ['#ffd6a5', '#fdffb6']
];

function drawSamplePhoto(ctx, x, y, w, h, shot = 0) {
    const [c1, c2] = SAMPLE_COLORS[shot % SAMPLE_COLORS.length];
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const r = Math.min(w, h);
    ctx.fillStyle = '#5b6b7a';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.42, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.42 + r * 0.6, r * 0.34, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
}

// Ambil satu frame dari webcam sebagai canvas (belum di-mirror)
function snapshotVideo(video) {
    const c = document.createElement('canvas');
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    return c;
}

// Gambar hasil jepretan ke kotak foto (mirror, crop supaya pas)
// idolFor(shotIndex) opsional: mengembalikan { img, side, size } untuk foto bareng idol
function drawShots(shots, idolFor) {
    return (ctx, x, y, w, h, shotIndex = 0) => {
        const src = shots[Math.min(shotIndex, shots.length - 1)];
        const vw = src.width || w;
        const vh = src.height || h;
        const scale = Math.max(w / vw, h / vh);
        const sw = w / scale;
        const sh = h / scale;
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;
        ctx.save();
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
        ctx.restore();

        const idol = idolFor && idolFor(shotIndex);
        if (idol && typeof drawIdol === 'function') {
            drawIdol(ctx, idol.img, x, y, w, h, idol.side, idol.size);
        }
    };
}
