# Foto member untuk fitur "Foto Bareng Idol"

Taruh foto tiap member di folder grupnya, dengan nama file sesuai daftar di `idols.js`.

```
idols/
  cortis/
    martin-1.png ... martin-10.png   (member dengan beberapa pose)
    james.png                        (member dengan satu foto)
    juhoon.png
    seonghyeon.png
    keonho.png
```

Kalau satu member punya beberapa pose, beri nama `<member>-1.png`, `<member>-2.png`, dst.,
lalu isi jumlahnya di `idols.js`, misalnya `{ id: 'james', name: 'James', poses: 8 }`.
Setiap jepretan akan memakai pose yang berbeda.

Syarat foto supaya hasilnya bagus:

- Format **PNG dengan latar transparan** (latar belakang sudah dihapus, misalnya pakai remove.bg atau Canva).
- Posisi **tegak**, badan/kaki ada di bagian bawah gambar (gambar ditempel dari bawah foto).
- Sisakan sedikit ruang kosong di atas kepala; potong sisa ruang kosong di kiri-kanan.
- Tinggi sekitar 1000-1500 px sudah cukup. Usahakan ukuran file di bawah 500 KB.

Member yang fotonya belum ada akan tampil abu-abu di web dan tidak bisa dipilih.

Menambah grup baru (misalnya Hearts2Hearts): tambahkan grupnya di `IDOL_GROUPS` di `idols.js`,
lalu buat folder `idols/<id grup>/` berisi foto-foto membernya.
