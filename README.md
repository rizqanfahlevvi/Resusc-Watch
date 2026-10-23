# Resusc Watch

Aplikasi Zepp OS (Amazfit Active Premium) untuk mencatat waktu setiap tindakan saat resusitasi cardiac arrest, dengan pengingat getar untuk siklus CPR 2 menit dan interval epinefrin 3 menit.

> Alat bantu timer & pencatatan. Bukan perangkat medis. Keputusan klinis tetap di tangan klinisi.

## Status

- `prototype/index.html` — prototipe UI interaktif di browser (v0.1) untuk menguji alur sebelum ditulis sebagai app Zepp OS.

## Spesifikasi v1 (disepakati)

- Fokus cardiac arrest, universal (tanpa input BB / hitung dosis).
- Recorder tindakan, bukan cheatsheet; saran (advice) tidak memblokir.
- Siklus CPR 2 menit (pra-peringatan 10 detik), pengingat epinefrin tiap 3 menit sejak dosis terakhir.
- Shock cukup dihitung (tanpa energi).
- Tombol di halaman yang bisa di-swipe; layar selalu menyala; getar sebagai pengingat.
- Undo + hapus event; riwayat beberapa sesi tersimpan di jam; tanpa identitas pasien.
- Format waktu: timer siklus (countdown) `MM:SS:cc` live; Total, countdown Epi, waktu sejak ROSC, ringkasan `MM:SS`; Log `MM:SS:cc`.
- Tahan tombol ±0,3 detik untuk mencatat (proteksi salah sentuh saat kompresi); tap sekilas tidak tercatat.
- Timer jeda kompresi di layar Rhythm Check; getar panjang saat jeda ≥ 10 detik.
- Ringkasan sesi: CPR fraction (target ≥ 80%), jeda rata-rata/terlama, jumlah siklus, time to first shock, time to first epi.
