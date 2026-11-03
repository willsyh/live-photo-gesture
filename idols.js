// ==================== FOTO BARENG IDOL ====================
// Foto member ditaruh di folder idols/<grup>/.
// - Member dengan satu foto: idols/<grup>/<member>.png
// - Member dengan beberapa pose (isi "poses"): idols/<grup>/<member>-1.png, -2.png, dst.
// Pakai PNG berlatar TRANSPARAN (potongan badan), tegak, kaki/badan di bagian bawah gambar.
//
// Menambah grup baru: tambahkan satu objek di IDOL_GROUPS, lalu taruh foto-fotonya
// di folder idols/<id grup>/.

// genre: 'kpop' atau 'jpop' (lihat IDOL_GENRES).
// type: 'boy' (boy group) atau 'girl' (girl group).
// logo (opsional): nama file logo di folder grup, misalnya 'logo.png' -> idols/cortis/logo.png.
//   Pakai PNG transparan. Kalau kosong, nama grup ditulis sebagai teks.
// Grup baru bisa dipilih setelah minimal satu member punya foto (isi "poses").
const IDOL_GENRES = [
    { id: 'kpop', name: 'K-Pop' },
    { id: 'jpop', name: 'J-Pop' }
];

const IDOL_GROUPS = [
    {
        id: 'cortis',
        name: 'CORTIS',
        genre: 'kpop',
        type: 'boy',
        logo: 'logo.png',
        members: [
            { id: 'martin', name: 'Martin', poses: 10 },
            { id: 'james', name: 'James', poses: 11 },
            { id: 'juhoon', name: 'Juhoon', poses: 9 },
            { id: 'seonghyeon', name: 'Seonghyeon', poses: 7 },
            { id: 'keonho', name: 'Keonho', poses: 7 }
        ]
    },
    {
        id: 'bts',
        name: 'BTS',
        genre: 'kpop',
        type: 'boy',
        members: [
            { id: 'rm', name: 'RM' },
            { id: 'jin', name: 'Jin' },
            { id: 'suga', name: 'SUGA' },
            { id: 'jhope', name: 'j-hope' },
            { id: 'jimin', name: 'Jimin' },
            { id: 'v', name: 'V' },
            { id: 'jungkook', name: 'Jung Kook' }
        ]
    },
    {
        id: 'straykids',
        name: 'Stray Kids',
        genre: 'kpop',
        type: 'boy',
        logo: 'logo.png',
        members: [
            { id: 'bangchan', name: 'Bang Chan', poses: 7 },
            { id: 'leeknow', name: 'Lee Know' },
            { id: 'changbin', name: 'Changbin' },
            { id: 'hyunjin', name: 'Hyunjin' },
            { id: 'han', name: 'Han' },
            { id: 'felix', name: 'Felix', poses: 3 },
            { id: 'seungmin', name: 'Seungmin' },
            { id: 'in', name: 'I.N' }
        ]
    },
    {
        id: 'hearts2hearts',
        name: 'Hearts2Hearts',
        genre: 'kpop',
        type: 'girl',
        members: [
            { id: 'jiwoo', name: 'Jiwoo' },
            { id: 'carmen', name: 'Carmen' },
            { id: 'yuha', name: 'Yuha' },
            { id: 'stella', name: 'Stella' },
            { id: 'juun', name: 'Juun' },
            { id: 'ana', name: 'A-na' },
            { id: 'ian', name: 'Ian' },
            { id: 'yeon', name: 'Ye-on' }
        ]
    },
    {
        id: 'illit',
        name: 'ILLIT',
        genre: 'kpop',
        type: 'girl',
        members: [
            { id: 'yunah', name: 'Yunah' },
            { id: 'minju', name: 'Minju' },
            { id: 'moka', name: 'Moka' },
            { id: 'wonhee', name: 'Wonhee' },
            { id: 'iroha', name: 'Iroha' }
        ]
    }
];

// Alamat file logo grup, atau null kalau grup belum punya logo
function groupLogoSrc(group) {
    return group && group.logo ? `idols/${group.id}/${group.logo}` : null;
}

// Grup bisa dipilih kalau ada member yang sudah punya foto
function groupAvailable(group) {
    return group.members.some(m => m.poses > 0);
}

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
