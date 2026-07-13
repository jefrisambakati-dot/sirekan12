# LAPORAN ANALISIS SISTEM & INTEGRASI FITUR MVP
## SIREKAN: Sistem Deteksi Real-Time Kecurangan Solar & Deviasi Rute Armada
**Dokumen Penjelasan Projek untuk Ujian / Presentasi Dosen**

---

## 1. Ringkasan Eksekutif (Executive Summary)
**SIREKAN** (Sistem Inspeksi & Rekonsiliasi Bahan Bakar Kendaraan) adalah platform dashboard monitoring real-time berbasis web yang dirancang khusus untuk mendeteksi kecurangan (*fraud*) konsumsi bahan bakar solar dan deviasi rute pada armada truk logistik. Platform ini mengintegrasikan visualisasi peta interaktif GIS, pelacakan sensor IoT (tingkat volume solar & status penutup tangki), serta manajemen insiden otomatis melalui sinkronisasi database dinamis.

---

## 2. Arsitektur Teknologi (Tech Stack)
Aplikasi dibangun menggunakan arsitektur modern berkinerja tinggi:
- **Frontend Framework**: React.js (Vite) untuk render UI SPA yang cepat dan ringan.
- **Backend-as-a-Service (BaaS)**: Supabase (PostgreSQL) sebagai database utama, sistem autentikasi, dan penyedia data real-time menggunakan PostgreSQL Replication (Realtime Channels).
- **Peta Interaktif (GIS)**: MapLibre GL dengan tile layer Satelit Esri & OSM untuk pelacakan rute optimal dan koordinat GPS supir.
- **Visualisasi Data**: Recharts untuk menampilkan grafik fluktuasi level solar secara detail per menit.
- **Desain & Animasi**: CSS Modern (Design Tokens) dengan fleksibilitas layout *grid* dominan map dan transisi mikro responsif pada perangkat mobile.

---

## 3. Struktur File Projek & Penjelasan Komponen
Berikut adalah pemetaan seluruh berkas penting di dalam direktori `src/` beserta fungsinya:

### A. Komponen Antarmuka Utama (`src/components/`)
1. **`DashboardPage.jsx`** *(Pusat Dashboard Admin)*
   - Mengatur tata letak utama halaman admin menggunakan grid responsif (65% area untuk peta interaktif & grafik bahan bakar, dan 35% untuk panel informasi insiden).
   - Mengelola state seleksi supir/truk dan mengkoordinasikan data ke komponen peta dan grafik.
2. **`MapContainer.jsx`** *(Peta Real-Time Dominan)*
   - Merender peta satelit interaktif menggunakan MapLibre GL.
   - Menampilkan posisi terkini truk dengan marker animasi berkedip (pulsing).
   - **Fitur Khusus**: Marker truk otomatis berubah menjadi **Merah Berkedip 🚨** jika terdeteksi anomali aktif, memudahkan fokus cepat admin.
   - Menggambar rute optimal (polyline biru) dibanding rute aktual supir (garis hijau) untuk memetakan deviasi.
3. **`FuelGraph.jsx`** *(Visualisasi Sensor Solar)*
   - Menampilkan grafik area (*Area Chart*) penurunan bahan bakar sepanjang perjalanan.
   - Dilengkapi tooltips dinamis untuk menunjukkan status penutup tangki (Terbuka/Tertutup) dan suhu solar.
   - Menampilkan indikator statistik: Sisa Solar, Total Terpakai, dan Status/Jenis Anomali saat ini.
4. **`IncidentFeed.jsx` & `AlertItem.jsx`** *(Manajemen Alarm/Kecurangan)*
   - Menampilkan daftar insiden yang diurutkan berdasarkan waktu kejadian terbaru.
   - Menggunakan penanda warna tingkat bahaya (*severity*): Merah (Kritis), Oranye (Tinggi), Kuning (Sedang), Biru (Rendah).
5. **`ActiveDrivers.jsx`**
   - Menampilkan daftar supir yang saat ini beroperasi di lapangan lengkap dengan informasi rute asal-tujuan, plat nomor, dan status berjalan.
6. **`LoginPage.jsx`**
   - Halaman masuk (login) terintegrasi Supabase Auth dengan penanganan error koneksi server yang informatif.

### B. Custom Hooks (`src/hooks/`)
- **`useAlerts.js`**: Melakukan query data insiden ke tabel `alerts` Supabase dan berlangganan (*subscribe*) perubahan data real-time menggunakan WebSocket.
- **`useActiveDrivers.js`**: Menarik data perjalanan aktif (`in_progress`) dari tabel `trips` dan menggabungkannya dengan koordinat GPS terakhir dari tabel `gps_data`.
- **`useFuelData.js`**: Mengambil data riwayat sensor bahan bakar untuk dirender ke grafik.

### C. Utilitas & Desain (`src/utils/` & `src/styles/`)
- **`helpers.js`**: Menyediakan fungsi parser data mentah JSON, konversi waktu ke format relatif (misal: "3 menit lalu"), dan format label teks.
- **`design-tokens.css`**: Menyimpan variabel global CSS (warna utama, tipografi, radius border, dan bayangan efek premium).
- **`index.css`**: Berisi seluruh styling aplikasi, termasuk media queries untuk adaptasi penuh tampilan mobile.

---

## 4. Penjelasan 10 Fitur Anomali MVP (Skenario Kasus Uji)
Untuk membuktikan kelayakan MVP (*Minimum Viable Product*), sistem disuntikkan 10 skenario kecurangan solar yang lazim terjadi di industri logistik:

1. **Kebocoran Solar (`fuel_leak`) — Arya Pratama (DT-06)**
   - *Deteksi*: Penurunan drastis volume solar sebesar 45L dalam waktu singkat saat mesin mati/truk diam.
2. **Deviasi Rute (`route_deviation`) — Jefry Sambakati (DT-08)**
   - *Deteksi*: Koordinat GPS keluar sejauh 8.3 km dari koridor rute geofence resmi menuju titik tidak sah.
3. **Pengisian Solar Tidak Resmi (`unauthorized_refuel`) — Agum Kurniawan (DT-07)**
   - *Deteksi*: Volume tangki tiba-tiba naik (+60L) di lokasi koordinat bengkel swasta, bukan di SPBU Pertamina resmi.
4. **Kecepatan Abnormal (`speed_anomaly`) — Revan Maulana (DT-02)**
   - *Deteksi*: Truk melaju pada kecepatan 118 km/jam, memicu pemborosan solar 2.3x lipat dibanding batas kecepatan efisiensi.
5. **Engine Idle Berlebihan (`excessive_idle`) — Akram Hidayat (DT-04)**
   - *Deteksi*: Mesin dibiarkan menyala terus-menerus selama 2.5 jam tanpa pergerakan roda di rest area, membuang solar sia-sia.
6. **Manipulasi Odometer (`odometer_fraud`) — Faris Alfarizi (DT-01)**
   - *Deteksi*: Selisih jarak tempuh nyata versi GPS (47 km) jauh lebih rendah dibanding klaim jarak pada catatan manual driver (89 km).
7. **Pengurasan Solar / Siphoning (`fuel_siphoning`) — Madan Saputra (DT-09)**
   - *Deteksi*: Penurunan drastis 70L hanya dalam waktu 8 menit saat truk berhenti di tempat gelap (indikasi solar disedot paksa).
8. **Berhenti di Zona Larangan (`unauthorized_stop`) — Asri Nugroho (DT-05)**
   - *Deteksi*: Truk berhenti lama di area klasifikasi "Zona Merah" transaksi solar ilegal (kencing solar).
9. **Konsumsi Solar Abnormal (`abnormal_consumption`) — Fatir Ramadhan (DT-03)**
   - *Deteksi*: Rasio efisiensi bahan bakar sangat buruk (konsumsi solar 95L untuk rute pendek 120 km).
10. **Pemalsuan Struk SPBU (`receipt_fraud`) — Fadlan Setiawan (DT-10)**
    - *Deteksi*: Driver mengklaim struk pembelian solar 120L secara manual, namun log GPS membuktikan truk tidak pernah singgah di SPBU tersebut.

---

## 5. Kesimpulan Penilaian Kelayakan Akademik
Aplikasi ini memenuhi standar kelayakan skripsi/projek akhir karena:
1. **Real-Time Data Sync**: Menggunakan teknologi websocket/real-time replication PostgreSQL untuk pembaruan instan tanpa reload browser.
2. **Visual & Analitis**: Menggabungkan data spasial peta GIS dan grafik statistik deret waktu (*time-series*).
3. **Kesiapan Mobile**: Mendukung penuh pemantauan fleksibel oleh admin di lapangan melalui antarmuka responsif ramah smartphone.
