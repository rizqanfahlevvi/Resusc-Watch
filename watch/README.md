# Code Blue Helper — app Zepp OS

App jam untuk Amazfit (layar bulat, Zepp OS API 3.0+). Perangkat uji utama: Amazfit Active Premium, Zepp OS 5, layar 466×466 px. Fiturnya sama dengan prototipe di `../prototype/index.html`.

## Struktur

| Path | Isi |
|---|---|
| `app.json` | Konfigurasi app: nama, versi, izin, daftar halaman, target layar bulat |
| `page/gt/home` | Layar awal: START / LANJUT CODE, Riwayat, Credit |
| `page/gt/code` | Layar utama saat code: timer, ring siklus, grid tombol, log, UNDO, Rhythm Check |
| `page/gt/summary` | Ringkasan sesi (durasi, outcome, CPR fraction) |
| `page/gt/detail` | Metrik kualitas + log lengkap satu sesi |
| `page/gt/history` | Daftar sesi tersimpan (maks. 20) |
| `page/gt/credit` | Credit |
| `shared/core.js` | Logika murni (siklus, epi, metrik, format waktu) — diuji di `test/` |
| `shared/storage.js` | Simpan sesi berjalan & riwayat di jam |
| `shared/vibrate.js` | Pola getar per jenis pengingat |
| `shared/ui.js` | Helper widget |

## Menjalankan di Simulator (pertama kali)

1. Install **Node.js LTS** dari nodejs.org.
2. Install **Zepp OS Simulator** dari situs developer Zepp (docs.zepp.com → Simulator), lalu buka dan pilih perangkat bulat (mis. Amazfit Active 2).
3. Buka folder `watch/` di VS Code, lalu di terminal VS Code jalankan:
   ```
   npm install -g @zeppos/zeus-cli
   npm install
   zeus dev
   ```
   Pilih perangkat yang sama dengan di Simulator. App langsung terbuka di Simulator dan otomatis reload setiap file disimpan.

## Memasang ke jam

1. Buat akun di **Zepp Developer Console** (gratis), lalu di terminal: `zeus login`.
2. Di app **Zepp** (HP): Profil → Pengaturan → Tentang → tap logo Zepp beberapa kali sampai **Developer Mode** aktif (letak menunya bisa sedikit berbeda antar versi app Zepp).
3. Jalankan `zeus preview`, pilih perangkat, lalu scan QR yang muncul dari Zepp → Profil → Developer Mode → Scan.

> `appId` di `app.json` (1000001) masih placeholder. Untuk publish ke store, ganti dengan appId resmi dari Developer Console.

## Tes logika

```
npm test
```

## Yang perlu diverifikasi di Simulator / jam

Bagian ini ditulis dari type definitions resmi (`@zeppos/device-types`) tapi belum pernah dijalankan di Simulator:

- Ring siklus mulai dari jam 12 (konvensi sudut `ARC`).
- Arah swipe: geser ke kiri → halaman berikutnya.
- Widget yang disembunyikan tidak ikut menangkap sentuhan (overlay Rhythm Check / konfirmasi).
- Ukuran teks pas di layar 466 px.
- Rasa getar tiap pola dan konsumsi baterai dengan layar selalu menyala.
