/**
 * Script untuk upload file ke Supabase Storage
 *
 * CARA PAKAI:
 * 1. Edit file ini, isi URL, key, dan file yang mau di-upload
 * 2. Jalankan: node upload-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============ KONFIGURASI - GANTI INI ============
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const BUCKET_NAME = 'audio-assets'; // atau 'photo-assets'
// ==================================================

// Tambah file yang mau di-upload di sini
const FILES_TO_UPLOAD = [
    // { url: 'https://example.com/sound.mp3', filename: 'sound.mp3' },
];

const TEMP_DIR = path.join(__dirname, '_temp_uploads');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    if (FILES_TO_UPLOAD.length === 0) {
        console.log('Tidak ada file untuk di-upload. Edit FILES_TO_UPLOAD di file ini.');
        return;
    }

    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    console.log(`Mulai upload ${FILES_TO_UPLOAD.length} file...\n`);

    for (const file of FILES_TO_UPLOAD) {
        try {
            console.log(`Downloading: ${file.filename}`);
            const buffer = await downloadFile(file.url);

            console.log(`Uploading: ${file.filename}`);
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(file.filename, buffer, {
                    contentType: 'audio/mpeg',
                    upsert: true
                });

            if (error) throw error;

            console.log(`Berhasil: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file.filename}\n`);
        } catch (err) {
            console.error(`Gagal: ${file.filename} - ${err.message}\n`);
        }
    }

    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log('Selesai!');
}

main();
