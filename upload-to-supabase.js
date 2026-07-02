/**
 * Script untuk upload audio ke Supabase Storage
 * 
 * CARA PAKAI:
 * 1. Buat project Supabase di supabase.com
 * 2. Buat bucket "audio-assets" (Public)
 * 3. Copy Supabase URL dan anon key
 * 4. Jalankan: node upload-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============ KONFIGURASI - GANTI INI ============
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co'; // Ganti dengan URL project kamu
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Ganti dengan anon key kamu
const BUCKET_NAME = 'audio-assets'; // Nama bucket di Supabase
// ==================================================

const AUDIO_FILES = [
    { id: 'audioLawan', url: 'https://cdn.ranzzawok.my.id/media/music/med_6cae0737736f3f08.mp3', filename: 'lawan.mp3' },
    { id: 'audioBlur', url: 'https://cdn.ranzzawok.my.id/media/music/med_8b7250a727afaac0.mp3', filename: 'blur.mp3' },
    { id: 'audioTelunjuk', url: 'https://cdn.ranzzawok.my.id/media/music/med_cf4dd8e9f4f15298.mp3', filename: 'telunjuk.mp3' },
    { id: 'audioCemberut', url: 'https://cdn.ranzzawok.my.id/media/music/med_c080885d7aa2ab64.mp3', filename: 'cemberut.mp3' },
    { id: 'audioTutupMulut', url: 'https://cdn.ranzzawok.my.id/media/music/med_d894e15841dd5a1c.mp3', filename: 'tutup_mulut.mp3' },
    { id: 'audioNgangap', url: 'https://cdn.ranzzawok.my.id/media/music/med_925f4b301de666b6.mp3', filename: 'ngangap.mp3' },
    { id: 'audioMetal', url: 'https://cdn.ranzzawok.my.id/media/music/med_a32f55f242434b67.mp3', filename: 'metal.mp3' },
];

const TEMP_DIR = path.join(__dirname, '_temp_audio');

// Inisialisasi Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Download file dari URL
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

// Upload file ke Supabase Storage
async function uploadToSupabase(buffer, filename) {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) throw error;
    return data;
}

// Dapat public URL
function getPublicUrl(filename) {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);
    return data.publicUrl;
}

// Main function
async function main() {
    console.log('🎵 Mulai upload audio ke Supabase...\n');

    // Buat temporary directory
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const results = [];

    for (const audio of AUDIO_FILES) {
        try {
            console.log(`📥 Downloading: ${audio.filename}`);
            const buffer = await downloadFile(audio.url);
            
            console.log(`☁️  Uploading: ${audio.filename}`);
            await uploadToSupabase(buffer, audio.filename);
            
            const publicUrl = getPublicUrl(audio.filename);
            console.log(`✅ Berhasil: ${publicUrl}\n`);
            
            results.push({
                id: audio.id,
                oldUrl: audio.url,
                newUrl: publicUrl,
                filename: audio.filename
            });
        } catch (error) {
            console.error(`❌ Gagal upload ${audio.filename}:`, error.message);
        }
    }

    // Bersihkan temporary directory
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    // Generate HTML yang sudah diupdate
    console.log('\n' + '='.repeat(60));
    console.log('📋 COPY PASTE KE index.html:\n');
    
    let htmlOutput = '';
    for (const r of results) {
        htmlOutput += `    <audio id="${r.id}" src="${r.newUrl}" loop></audio>\n`;
    }
    console.log(htmlOutput);

    // Simpan ke file
    const outputFile = path.join(__dirname, 'supabase-urls.txt');
    fs.writeFileSync(outputFile, htmlOutput);
    console.log(`\n💾 Tersimpan ke: ${outputFile}`);
    
    console.log('\n🎉 Selesai! Copy URL di atas ke index.html');
}

main().catch(console.error);
