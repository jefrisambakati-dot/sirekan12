# Panduan Persiapan Presentasi Kamera: Sirekan Command Center

Dokumen ini dirancang sebagai lembar contekan (*cheat-sheet*) dan naskah analisis mendalam untuk presentasi di depan kamera mengenai proyek **Sirekan Command Center**. 

---

## 1. Risiko Pengembangan Sistem (System Development Risks)

Saat mempresentasikan bagian ini, tunjukkan bahwa Anda adalah seorang praktisi yang realistis dengan mengidentifikasi risiko utama serta langkah mitigasinya (*risk mitigation*):

| Kategori Risiko | Deskripsi Risiko | Strategi Mitigasi |
| :--- | :--- | :--- |
| **Konektivitas GPS & Sensor** | Truk beroperasi di daerah tambang/terpencil dengan sinyal seluler tidak stabil (blank spot), menyebabkan kehilangan data telemetri real-time. | **Local Buffering**: Aplikasi Driver menyimpan koordinat & sensor secara lokal di HP saat offline, lalu otomatis menyinkronkan ke Supabase begitu mendapat sinyal. |
| **Akurasi Sensor Solar** | Sensor tangki (fuel level) memiliki noise akibat guncangan kendaraan di jalanan tambang yang tidak rata. | **Moving Average Filter**: Menggunakan algoritma pemulusan data di backend untuk menyaring noise guncangan dan hanya mendeteksi penurunan drastis yang konsisten. |
| **Resistensi Driver (Sabotase)** | Driver sengaja mematikan GPS HP, menutup kamera sensor, atau merusak perangkat telemetri untuk menyembunyikan kecurangan. | **Sistem Konsekuensi & Geofencing**: Jika GPS mati selama >10 menit di luar area loading, sistem otomatis mengirim alert "GPS Offline" dan memblokir pencairan insentif perjalanan. |
| **Integritas Data Timbangan** | Data berat muatan di timbangan dimanipulasi secara manual oleh oknum operator timbangan. | **Sistem Integrasi IoT Otomatis**: Integrasi langsung mesin timbangan ke Supabase menggunakan API tanpa campur tangan operator manusia (*zero-human intervention*). |

---

## 2. Metode SDLC yang Sesuai (Recommended SDLC Method)

Untuk proyek ini, metode yang paling sesuai adalah **Agile dengan framework Scrum** atau **Prototyping Model**. 

### Mengapa Agile/Scrum?
* **Iteratif & Adaptif**: Kebutuhan pelacakan kecurangan sangat dinamis. Taktik kecurangan driver di lapangan terus berubah, sehingga sistem harus cepat beradaptasi.
* **Kolaborasi Dispatcher & Developer**: Setiap *Sprint* (biasanya 2 minggu) menghasilkan peningkatan fitur dashboard yang langsung diuji oleh Dispatcher (operator command center) untuk mendapatkan umpan balik instan.
* **Fokus pada Feedback**: Dengan Scrum, kita bisa merilis modul peta terlebih dahulu pada Sprint 1, modul deteksi sensor pada Sprint 2, dan modul rekonsiliasi laporan pada Sprint 3.

---

## 3. Minimum Viable Product (MVP) & Fitur Prioritas Awal

Untuk peluncuran pertama (MVP) dalam waktu cepat, fokus diletakkan pada penyelesaian masalah utama (pencurian bahan bakar):

1. **Dashboard Alert Real-time (Prioritas 1)**: Feed insiden instan jika terjadi penurunan level solar yang tidak wajar (pencurian aktif) saat perjalanan sedang berlangsung.
2. **Pelacakan Live GPS (Prioritas 2)**: Peta satelit sederhana untuk memantau posisi truk aktif dan melihat jika ada truk yang berhenti terlalu lama di lokasi mencurigakan (lapak solar ilegal).
3. **Aplikasi Driver Sederhana (Prioritas 3)**: Scan QR untuk mengaitkan Driver dengan Truk sebelum berangkat guna mencatat akuntabilitas solar awal.
4. **Laporan Rekonsiliasi Solar Sederhana (Prioritas 4)**: Tabel perbandingan antara solar awal yang diinput vs solar akhir saat tiba di jetty.

---

## 4. Nilai Tambah Proyek (Unique Value Proposition)

Gunakan poin-poin ini di depan kamera untuk meyakinkan investor atau manajemen tentang urgensi proyek:

* **Pencegahan Kebocoran Finansial Langsung**: Kebocoran solar (solar siphoning) menyumbang kehilangan 15-20% biaya operasional logistik tambang. Sistem ini mendeteksi pencurian dalam hitungan detik, bukan hari, menghemat ratusan juta rupiah per bulan.
* **Audit Trail & Bukti Digital Kuat**: Setiap alert kecurangan dilengkapi dengan *evidence data* (titik koordinat persis di peta, grafik penurunan solar, kecepatan truk, dan jam kejadian) yang tidak bisa disangkal oleh driver.
* **Optimalisasi Rute & Keamanan**: Selain memantau solar, sistem meminimalkan penggunaan truk untuk keperluan pribadi driver atau rute menyimpang (*illegal route deviation*).
* **Integrasi IoT Tanpa Biaya Infrastruktur Mahal**: Menggunakan kombinasi aplikasi mobile driver (memanfaatkan sensor GPS HP bawaan) dan sensor solar eksternal standar, meminimalkan biaya investasi hardware awal (*CAPEX*).

---

## 5. Analisis Kompetitor / Sistem Sejenis

Bandingkan proyek Anda dengan solusi yang ada di pasar untuk menunjukkan keunggulannya:

| Fitur / Parameter | GPS Tracker Standar (Kompetitor Umum) | ERP Logistik Konvensional | Sirekan Command Center (Proyek Kita) |
| :--- | :--- | :--- | :--- |
| **Real-time Alert** | Ya, tapi hanya sebatas geofence/kecepatan. | Tidak, berbasis input manual setelah perjalanan selesai. | **Ya**, alert khusus kecurangan solar, deviasi rute, dan manipulasi timbangan secara instan. |
| **Analisis Rekonsiliasi** | Tidak ada. Hanya melacak koordinat. | Ada, namun lambat (mingguan/bulanan). | **Otomatis & Real-time** setelah truk melakukan penimbangan dan bongkar muat. |
| **Akurasi Data Sensor** | Tergantung modul GPS yang dipasang di tangki (mahal). | Berdasarkan nota pembelian bahan bakar (rawan manipulasi). | **Kombinasi Sensor IoT + Integrasi Timbangan** dengan verifikasi silang QR Token supir. |
| **Biaya Implementasi** | Mahal (biaya hardware per truk tinggi). | Sangat mahal (lisensi software & integrasi ERP rumit). | **Sangat Fleksibel & Terjangkau** (menggunakan Supabase Backend & Peta Open-Source). |

---

## 6. Kelayakan Sistem Bagi Pengguna (User Feasibility)

Kelayakan dianalisis dari tiga aspek utama agar sistem diadopsi dengan sukses:

### A. Kelayakan Teknis (Technical Feasibility)
* **Keringanan Sistem**: Dashboard Command Center berbasis web yang ringan menggunakan Vite & React, dapat diakses dari laptop standar kantor tanpa spesifikasi tinggi.
* **Kebutuhan Bandwidth Rendah**: Supabase Realtime dioptimalkan menggunakan WebSockets yang hanya mentransfer teks koordinat kecil (JSON), sehingga tidak membebani jaringan internet kantor tambang.

### B. Kelayakan Operasional (Operational Feasibility)
* **Dashboard yang Intuitif (Dispatcher)**: Tampilan menggunakan warna kontras tinggi (tema gelap) dengan indikator visual merah menyala (*pulsing*) untuk alert kritis. Operator dapat mendeteksi bahaya dalam 1 detik tanpa perlu membaca teks yang rumit.
* **Aplikasi Driver Ramah Pengguna**: Aplikasi mobile untuk supir dirancang dengan metode **2-Step Flow** (Scan QR -> Input Solar & Jalan). Supir tidak perlu mahir teknologi; cukup arahkan kamera HP ke kartu QR mereka.

### C. Kelayakan Finansial (Financial Feasibility)
* **Return on Investment (ROI) Cepat**: Estimasi pengembalian modal investasi sistem (biaya hosting Supabase + lisensi sensor) dapat dicapai dalam waktu **kurang dari 2 bulan** hanya dengan mencegah pencurian solar pada 2-3 armada truk.
