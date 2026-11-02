// ==================== FOTO BARENG IDOL ====================
// Foto member ditaruh di folder idols/<grup>/.
// - Member dengan satu foto: idols/<grup>/<member>.png
// - Member dengan beberapa pose (isi "poses"): idols/<grup>/<member>-1.png, -2.png, dst.
// Pakai PNG berlatar TRANSPARAN (potongan badan), tegak, kaki/badan di bagian bawah gambar.
//
// Menambah grup baru: tambahkan satu objek di IDOL_GROUPS, lalu taruh foto-fotonya
// di folder idols/<id grup>/.

const IDOL_GROUPS = [
    {
        id: 'cortis',
        name: 'CORTIS',
        members: [
            { id: 'martin', name: 'Martin', poses: 10 },
            { id: 'james', name: 'James', poses: 11 },
            { id: 'juhoon', name: 'Juhoon', poses: 9 },
            { id: 'seonghyeon', name: 'Seonghyeon', poses: 7 },
            { id: 'keonho', name: 'Keonho', poses: 7 }
        ]
    }
];

// Semua file foto (pose) milik satu member
function idolSrcs(group, member) {
    if (!member.poses) return [`idols/${group.id}/${member.id}.png`];
    return Array.from({ length: member.poses }, (_, i) => `idols/${group.id}/${member.id}-${i + 1}.png`);
}

function getIdolGroup(id) {
    return IDOL_GROUPS.find(g => g.id === id) || null;
}

// Cache gambar member: { src: HTMLImageElement }
const idolImages = {};

function loadIdolImage(src, onChange) {
    if (idolImages[src]) return idolImages[src];
    const img = new Image();
    img.onload = () => onChange && onChange();
    img.onerror = () => {
        img.dataset.missing = '1';
        if (onChange) onChange();
    };
    img.src = src;
    idolImages[src] = img;
    return img;
}

function idolReady(img) {
    return Boolean(img && img.complete && img.naturalWidth && !img.dataset.missing);
}

// Gambar member di dalam kotak foto (x, y, w, h).
// side: 'left' | 'right', size: tinggi member dibanding tinggi kotak (0.5 - 1).
function drawIdol(ctx, img, x, y, w, h, side = 'right', size = 0.9) {
    if (!idolReady(img)) return;
    let ih = h * size;
    let iw = ih * (img.naturalWidth / img.naturalHeight);
    // jangan sampai member menutupi lebih dari 60% lebar foto
    const maxW = w * 0.6;
    if (iw > maxW) {
        iw = maxW;
        ih = iw * (img.naturalHeight / img.naturalWidth);
    }
    const margin = w * 0.02;
    const ix = side === 'left' ? x + margin : x + w - iw - margin;
    ctx.drawImage(img, ix, y + h - ih, iw, ih);
}
