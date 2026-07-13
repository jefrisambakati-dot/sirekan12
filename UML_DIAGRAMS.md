# Sirekan Command Center - Kode UML Diagrams untuk VS Code

Dokumen ini berisi kode sumber UML diagram (**Mermaid** dan **PlantUML**) untuk sistem Sirekan Command Center. Anda dapat menggunakan kode ini langsung di VS Code.

## Cara Menggunakan di VS Code

### Opsi 1: Menggunakan Mermaid (Sangat Direkomendasikan)
1. Pasang ekstensi **Markdown Preview Mermaid Support** atau **GitGraph.js & Mermaid Previewer** di VS Code.
2. Buka file `.md` ini di VS Code, tekan `Ctrl + Shift + V` untuk membuka *Markdown Preview*. Diagram akan otomatis dirender secara visual dan interaktif!

### Opsi 2: Menggunakan PlantUML
1. Pasang ekstensi **PlantUML** oleh *jebbs* di VS Code.
2. Pastikan Java terpasang di komputer Anda (atau gunakan server render PlantUML bawaan ekstensi).
3. Buat file baru dengan ekstensi `.puml` atau `.wsd` (misalnya `class_diagram.puml`), salin kode PlantUML di bawah, lalu tekan `Alt + D` untuk mempreview diagram secara langsung.

---

## 1. Use Case Diagram
Menggambarkan interaksi aktor (Dispatcher dan Supir) dengan sistem Sirekan.

### A. Versi Mermaid
```mermaid
left-to-right-direction
flowchart TD
    subgraph Aktor
        Dispatcher([Dispatcher / Command Center])
        Supir([Supir Truk])
    end

    subgraph Sirekan_System [Sistem Sirekan Command Center]
        UC1(Login / Autentikasi)
        UC2(Pantau Live Map Armada)
        UC3(Lihat Notifikasi Alert Kecurangan)
        UC4(Analisis Grafik Sensor Solar)
        UC5(Ekspor Laporan PDF & Excel)
        
        UC6(Scan QR Token Driver)
        UC7(Pilih Rute & Input Solar Awal)
        UC8(Mulai Perjalanan / Trip)
        UC9(Kirim Telemetri GPS & Solar Otomatis)
    end

    Dispatcher --> UC1
    Dispatcher --> UC2
    Dispatcher --> UC3
    Dispatcher --> UC4
    Dispatcher --> UC5

    Supir --> UC6
    Supir --> UC7
    Supir --> UC8
    
    UC9 -.->|Kirim Data ke| UC2
    UC9 -.->|Pemicu Deteksi| UC3
```

### B. Versi PlantUML
```plantuml
@startuml UseCase_Sirekan
left to right direction
skinparam packageStyle rectangle

actor "Dispatcher" as disp
actor "Supir Truk" as driver
actor "Sistem GPS/Sensor" as gps

rectangle "Sistem Sirekan Command Center" {
    usecase "Login & Kelola Akun" as UC_Login
    usecase "Pantau Peta Live View Armada" as UC_LiveMap
    usecase "Terima Alert Kecurangan Solar" as UC_Alert
    usecase "Analisis Grafik Sensor Solar" as UC_FuelGraph
    usecase "Cetak & Ekspor Laporan" as UC_Reports
    
    usecase "Scan QR Token Driver" as UC_ScanQR
    usecase "Pilih Rute & Input Solar Awal" as UC_SelectTrip
    usecase "Mulai Perjalanan (Trip)" as UC_StartTrip
    usecase "Kirim Telemetri GPS & Sensor" as UC_Telemetry
}

disp --> UC_Login
disp --> UC_LiveMap
disp --> UC_Alert
disp --> UC_FuelGraph
disp --> UC_Reports

driver --> UC_ScanQR
driver --> UC_SelectTrip
driver --> UC_StartTrip

gps --> UC_Telemetry
UC_Telemetry ..> UC_LiveMap : <<update>>
UC_Telemetry ..> UC_Alert : <<trigger>>
@enduml
```

---

## 2. Class Diagram
Menggambarkan skema database dan relasi antar tabel data di Supabase.

### A. Versi Mermaid
```mermaid
classDiagram
    class Company {
        +UUID id
        +String name
        +Timestamp created_at
    }
    
    class User {
        +UUID id
        +String email
        +String full_name
        +String role
        +UUID company_id
    }
    
    class Driver {
        +UUID id
        +UUID company_id
        +String name
        +String license_number
        +String qr_token
        +String status
    }
    
    class Vehicle {
        +UUID id
        +UUID company_id
        +String hull_number
        +String plate_number
        +Float fuel_tank_capacity
        +String status
    }
    
    class Route {
        +UUID id
        +UUID company_id
        +String name
        +String source_location
        +String destination_location
        +Float distance_km
        +JSON polyline
    }
    
    class Trip {
        +UUID id
        +UUID vehicle_id
        +UUID driver_id
        +UUID route_id
        +Timestamp start_time
        +Timestamp end_time
        +String status
        +Float fuel_before_liter
    }
    
    class GpsData {
        +UUID id
        +UUID trip_id
        +Float latitude
        +Float longitude
        +Float speed_kmh
        +Timestamp recorded_at
        +String location_name
        +Boolean is_geofence_official
    }
    
    class FuelSensorData {
        +UUID id
        +UUID trip_id
        +Float fuel_level_liter
        +String fuel_cap_status
        +Float temperature_celsius
        +Timestamp recorded_at
    }
    
    class Alert {
        +UUID id
        +UUID trip_id
        +String fraud_type
        +String severity
        +String status
        +String description
        +JSON evidence_data
        +Timestamp created_at
    }

    class ReconciliationResult {
        +UUID id
        +UUID trip_id
        +Float expected_fuel_consumption_liter
        +Float actual_fuel_consumption_liter
        +Float fuel_variance_percent
        +Float weight_variance_kg
        +Float weight_discrepancy_percent
        +Float route_deviation_percent
        +Float reconciliation_score
        +String status
    }

    Company "1" --> "0..*" User : memiliki
    Company "1" --> "0..*" Driver : mempekerjakan
    Company "1" --> "0..*" Vehicle : memiliki
    Company "1" --> "0..*" Route : menentukan
    
    Trip "0..*" --> "1" Driver : dikendarai oleh
    Trip "0..*" --> "1" Vehicle : menggunakan
    Trip "0..*" --> "1" Route : melalui
    
    Trip "1" --> "0..*" GpsData : mencatat koordinat
    Trip "1" --> "0..*" FuelSensorData : merekam solar
    Trip "1" --> "0..*" Alert : memicu
    Trip "1" --> "0..1" ReconciliationResult : menghasilkan
```

### B. Versi PlantUML
```plantuml
@startuml Class_Sirekan
skinparam classAttributeIconSize 0

class Company {
    + id: UUID
    + name: String
    + created_at: Timestamp
}

class User {
    + id: UUID
    + email: String
    + full_name: String
    + role: String
    + company_id: UUID
}

class Driver {
    + id: UUID
    + company_id: UUID
    + name: String
    + license_number: String
    + qr_token: String
    + status: String
}

class Vehicle {
    + id: UUID
    + company_id: UUID
    + hull_number: String
    + plate_number: String
    + fuel_tank_capacity: Float
    + status: String
}

class Route {
    + id: UUID
    + company_id: UUID
    + name: String
    + source_location: String
    + destination_location: String
    + distance_km: Float
    + polyline: JSON
}

class Trip {
    + id: UUID
    + vehicle_id: UUID
    + driver_id: UUID
    + route_id: UUID
    + start_time: Timestamp
    + end_time: Timestamp
    + status: String
    + fuel_before_liter: Float
}

class GpsData {
    + id: UUID
    + trip_id: UUID
    + latitude: Float
    + longitude: Float
    + speed_kmh: Float
    + recorded_at: Timestamp
    + location_name: String
    + is_geofence_official: Boolean
}

class FuelSensorData {
    + id: UUID
    + trip_id: UUID
    + fuel_level_liter: Float
    + fuel_cap_status: String
    + temperature_celsius: Float
    + recorded_at: Timestamp
}

class Alert {
    + id: UUID
    + trip_id: UUID
    + fraud_type: String
    + severity: String
    + status: String
    + description: String
    + evidence_data: JSON
    + created_at: Timestamp
}

class ReconciliationResult {
    + id: UUID
    + trip_id: UUID
    + expected_fuel_consumption_liter: Float
    + actual_fuel_consumption_liter: Float
    + fuel_variance_percent: Float
    + weight_variance_kg: Float
    + weight_discrepancy_percent: Float
    + route_deviation_percent: Float
    + reconciliation_score: Float
    + status: String
}

Company "1" -- "0..*" User
Company "1" -- "0..*" Driver
Company "1" -- "0..*" Vehicle
Company "1" -- "0..*" Route

Trip "0..*" -left- "1" Driver
Trip "0..*" -right- "1" Vehicle
Trip "0..*" -- "1" Route

Trip "1" *-- "0..*" GpsData
Trip "1" *-- "0..*" FuelSensorData
Trip "1" *-- "0..*" Alert
Trip "1" *-- "0..1" ReconciliationResult
@enduml
```

---

## 3. Sequence Diagram
Menggambarkan alur mulai perjalanan dari sisi Supir (Driver App) hingga pembaruan peta secara real-time dan pemicuan alert di Dashboard Dispatcher.

### A. Versi Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Supir
    participant DApp as Driver App (HP)
    participant DB as Supabase DB
    participant Dash as Dashboard (Dispatcher)

    Driver->>DApp: Buka App & Scan QR Code
    DApp->>DB: Validasi qr_token Driver
    DB-->>DApp: Return Data Supir Valid
    
    Driver->>DApp: Pilih Trip & Input Solar Awal (L)
    Driver->>DApp: Klik "Mulai Perjalanan"
    DApp->>DB: UPDATE trips (status = 'in_progress', fuel_before_liter, start_time)
    
    Note over DB,Dash: Supabase Realtime Channel Memicu Event
    DB-->>Dash: Kirim Pembaruan Trip Aktif
    Dash->>Dash: Perbarui List Supir & Lokasi Peta
    
    loop Selama Perjalanan
        DApp->>DB: Kirim GPS Koordinat & Level Solar (Sensor API)
        Note over DB,Dash: Detektor Kecurangan Otomatis
        DB->>DB: Cek Deviasi Rute & Penurunan Solar Mendadak
        alt Kecurangan Terdeteksi (Misal: Pencurian Solar)
            DB->>DB: INSERT data ke tabel "alerts"
            DB-->>Dash: Kirim Data Alert Realtime (postgres_changes)
            Dash->>Dash: Mainkan Suara Alarm & Tampilkan Banner Kritis (Red Glow)
        end
    end
```

### B. Versi PlantUML
```plantuml
@startuml Sequence_Sirekan
autonumber
actor "Supir" as driver
participant "Driver App (Mobile)" as dapp
database "Supabase Database" as db
participant "Dashboard (Dispatcher)" as dash

driver -> dapp : Buka App & Scan QR Code
dapp -> db : Validasi qr_token Supir
db --> dapp : Return Data Supir Valid

driver -> dapp : Pilih Trip & Input Solar Awal
driver -> dapp : Klik "Mulai Perjalanan"
dapp -> db : UPDATE trips (status='in_progress', fuel_before_liter, start_time)

== Supabase Real-Time Broadcast ==
db --> dash : Event: Trip Baru Dimulai
dash -> dash : Refresh List Supir & Tampilkan Marker Truk di Peta

loop Telemetri Perjalanan (Real-Time)
    dapp -> db : INSERT gps_data & fuel_sensor_data (Tiap 5 Detik)
    db --> dash : Broadcast gps_data (Update marker truk di peta secara live)
    
    alt Sensor mendeteksi pencurian solar (>15 liter turun instan)
        db -> db : INSERT INTO alerts (fraud_type='fuel_theft', severity='critical')
        db --> dash : Broadcast alert baru (Real-time)
        dash -> dash : Aktifkan Sirine Dashboard & Nyalakan Alert Item Merah
    end
end
@enduml
```

---

## 4. Activity Diagram
Menggambarkan alur kerja operasional lengkap dari awal verifikasi pengemudi hingga analisis rekonsiliasi akhir perjalanan.

### A. Versi Mermaid
```mermaid
stateDiagram-v2
    [*] --> Driver_Scan_QR
    
    state Driver_Scan_QR {
        [*] --> Ambil_Token
        Ambil_Token --> Verifikasi_Database
        Verifikasi_Database --> Token_Valid : Ya
        Verifikasi_Database --> Tampilkan_Error : Tidak
        Tampilkan_Error --> Ambil_Token
    }
    
    Token_Valid --> Input_Detail_Solar_Awal
    Input_Detail_Solar_Awal --> Perjalanan_Dimulai
    
    state Perjalanan_Dimulai {
        [*] --> Tracking_GPS_dan_Sensor
        Tracking_GPS_dan_Sensor --> Deteksi_Anomali
        
        state Deteksi_Anomali {
            [*] --> Cek_Jalur_Geofence
            Cek_Jalur_Geofence --> Deviasi_Rute : Off-route
            Cek_Jalur_Geofence --> Aman_Rute : On-route
            
            [*] --> Cek_Penurunan_Solar
            Cek_Penurunan_Solar --> Pencurian_Solar : Turun Mendadak
            Cek_Penurunan_Solar --> Normal_Solar : Konsumsi Wajar
        }
    }
    
    Deviasi_Rute --> Trigger_Alert
    Pencurian_Solar --> Trigger_Alert
    
    Trigger_Alert --> Push_Command_Center : Realtime Notification
    Push_Command_Center --> Dispatcher_Tinjau_Lokasi
    
    Aman_Rute --> Trip_Selesai
    Normal_Solar --> Trip_Selesai
    Dispatcher_Tinjau_Lokasi --> Trip_Selesai
    
    state Trip_Selesai {
        [*] --> Hitung_Ekspektasi_Bahan_Bakar
        Hitung_Ekspektasi_Bahan_Bakar --> Bandingkan_Dengan_Aktual
        Bandingkan_Dengan_Aktual --> Hitung_Skor_Rekonsiliasi
        Hitung_Skor_Rekonsiliasi --> Simpan_Hasil_Rekonsiliasi
    }
    
    Simpan_Hasil_Rekonsiliasi --> Tampilkan_Laporan_Kinerja
    Tampilkan_Laporan_Kinerja --> [*]
```

### B. Versi PlantUML
```plantuml
@startuml Activity_Sirekan
start
:Supir membuka Driver App;
:Scan QR Token Supir;
if (Token Valid?) then (tidak)
  :Tampilkan pesan token tidak valid;
  stop
else (ya)
  :Pilih Trip & Input Volume Solar Awal;
  :Mulai Trip (Status: in_progress);
  fork
    :Sistem merekam GPS & Volume Solar secara berkala;
    backward:Kirim koordinat GPS & data solar;
    split
      if (Truk di luar geofence resmi?) then (ya)
        :Kirim Alert Deviasi Rute;
        :Dashboard menampilkan tanda deviasi;
      endif
    split  
      if (Solar berkurang drastis tiba-tiba?) then (ya)
        :Kirim Alert Pencurian Solar;
        :Dashboard membunyikan alarm kritis;
      endif
    end split
  fork again
    :Dispatcher memantau pergerakan truk di Command Center;
    if (Ada Alert Merah?) then (ya)
      :Dispatcher melakukan cek lokasi truk di peta;
      :Dispatcher menginvestigasi kecurangan;
    endif
  end merge
  
  :Truk tiba di lokasi tujuan (Trip Selesai);
  :Sistem menghitung data Aktual vs Ekspektasi Solar;
  :Hitung deviasi rute dan deviasi timbangan kargo;
  :Generate Skor Rekonsiliasi Akhir;
  :Simpan Data di Dashboard (Hasil Rekonsiliasi);
  :Hasilkan Laporan Performa Driver (Excel/PDF);
endif
stop
@enduml
```
