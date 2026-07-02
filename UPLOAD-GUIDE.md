# Panduan Upload Audio ke Supabase

## Langkah 1: Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan daftar/login
2. Klik **"New Project"**
3. Isi nama project, password, dan pilih region terdekat
4. Tunggu project selesai dibuat

## Langkah 2: Buat Bucket Storage

1. Masuk ke menu **Storage** di dashboard Supabase
2. Klik **"New Bucket"**
3. Isi:
   - Bucket name: `audio-assets`
   - Public: **✅ Centang (ON)**
4. Klik **"Create Bucket"**

## Langkah 3: Ambil API Credentials

1. Masuk ke menu **Settings** > **API**
2. Copy 2 value ini:
   - **Project URL** (format: `https://xxxxx.supabase.co`)
   - **anon public** key (format: `eyJhbGciOiJIUzI1NiIs...`)

## Langkah 4: Install Dependencies

Buka terminal di folder project, lalu jalankan:

```bash
# Rename package-upload.json jadi package.json
mv package-upload.json package.json

# Install dependencies
npm install
```

## Langkah 5: Konfigurasi Script

Buka file `upload-to-supabase.js` dan ganti 2 baris ini:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co'; // Ganti dengan Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIs...';         // Ganti dengan anon key
```

## Langkah 6: Jalankan Script

```bash
node upload-to-supabase.js
```

## Langkah 7: Update index.html

Script akan menghasilkan URL baru. Copy hasilnya ke file `index.html`:

```html
<!-- Ganti URL lama dengan URL Supabase -->
<audio id="audioLawan" src="https://xxx.supabase.co/storage/v1/object/public/audio-assets/lawan.mp3" loop></audio>
```

---

## Troubleshooting

### Error "Bucket not found"
- Pastikan bucket name sesuai (case-sensitive)
- Pastikan bucket sudah dibuat di dashboard Supabase

### Error "Unauthorized"
- Pastikan anon key benar
- Pastikan bucket di-set sebagai **Public**

### Upload lambat
- Normal untuk koneksi pertama
- File yang sama tidak akan di-upload ulang (upsert)
