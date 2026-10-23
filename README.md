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
