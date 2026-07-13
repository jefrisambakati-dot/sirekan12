-- ============================================================
-- SIREKAN DASHBOARD - DUMMY DATA ANOMALI LENGKAP
-- 10 Driver dengan berbagai kasus kecurangan solar
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. UPDATE DRIVERS (sesuaikan nama & data)
-- ============================================================
UPDATE drivers SET
  name = 'Arya Pratama',
  phone = '081234567001'
WHERE name ILIKE '%arya%' OR id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 0);

UPDATE drivers SET
  name = 'Jefry Sambakati',
  phone = '081234567002'
WHERE name ILIKE '%jefry%' OR id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 1);

UPDATE drivers SET
  name = 'Agum Kurniawan',
  phone = '081234567003'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 2);

UPDATE drivers SET
  name = 'Revan Maulana',
  phone = '081234567004'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 3);

UPDATE drivers SET
  name = 'Akram Hidayat',
  phone = '081234567005'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 4);

UPDATE drivers SET
  name = 'Faris Alfarizi',
  phone = '081234567006'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 5);

UPDATE drivers SET
  name = 'Madan Saputra',
  phone = '081234567007'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 6);

UPDATE drivers SET
  name = 'Asri Nugroho',
  phone = '081234567008'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 7);

UPDATE drivers SET
  name = 'Fatir Ramadhan',
  phone = '081234567009'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 8);

UPDATE drivers SET
  name = 'Fadlan Setiawan',
  phone = '081234567010'
WHERE id = (SELECT id FROM drivers ORDER BY id LIMIT 1 OFFSET 9);

-- ============================================================
-- 2. HAPUS ALERTS LAMA (bersihkan dulu)
-- ============================================================
DELETE FROM alerts;

-- ============================================================
-- 3. INSERT 10 ALERT ANOMALI (satu per driver)
-- Setiap alert mencerminkan kasus nyata di sistem SIREKAN
-- ============================================================

-- ALERT 1 - ARYA: Kebocoran Solar (Volume hilang tiba-tiba)
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Arya Pratama') ORDER BY start_time DESC LIMIT 1),
  'fuel_leak',
  'critical',
  'open',
  'Deteksi kebocoran solar pada truk DT-01. Volume solar turun 45L dalam 12 menit tanpa pergerakan kendaraan. Kemungkinan selang bocor atau pengurasan ilegal.',
  '{"fuel_before": 250, "fuel_after": 205, "drop_liters": 45, "duration_minutes": 12, "vehicle_moving": false, "location": "Pelabuhan Nusantara Kendari", "sensor_readings": [250, 247, 241, 230, 215, 205], "timestamp_readings": ["08:01", "08:03", "08:05", "08:07", "08:09", "08:13"]}',
  NOW() - INTERVAL '2 hours'
);

-- ALERT 2 - JEFRY: Deviasi Rute (Keluar jalur resmi)
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Jefry Sambakati') ORDER BY start_time DESC LIMIT 1),
  'route_deviation',
  'high',
  'open',
  'Truk DT-02 keluar dari rute resmi sejauh 8.3 km menuju area non-geofence di Jl. Soekarno Hatta Km 12. Durasi deviasi: 47 menit. Solar berkurang 28L saat di luar zona.',
  '{"deviation_km": 8.3, "deviation_minutes": 47, "unauthorized_location": "Jl. Soekarno Hatta Km 12", "fuel_lost_during_deviation": 28, "geofence_violations": 3, "last_official_point": "Baruga", "coordinates_offroute": [-4.0435, 122.5193]}',
  NOW() - INTERVAL '4 hours'
);

-- ALERT 3 - AGUM: Pengisian Solar Tidak Resmi
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Agum Kurniawan') ORDER BY start_time DESC LIMIT 1),
  'unauthorized_refuel',
  'critical',
  'investigating',
  'Truk DT-03 terdeteksi melakukan pengisian solar di luar SPBU resmi. Sensor mendeteksi kenaikan volume +60L di lokasi non-resmi (Bengkel Pak Doni). Diduga isi solar oplosan.',
  '{"refuel_location": "Bengkel Pak Doni, Anduonohu", "refuel_liters_added": 60, "is_official_spbu": false, "nearest_official_spbu": "Pertamina Wua-wua (4.2 km)", "stop_duration_minutes": 23, "coordinates": [-3.9981, 122.5312], "fuel_quality_indicator": "unknown"}',
  NOW() - INTERVAL '6 hours'
);

-- ALERT 4 - REVAN: Kecepatan Abnormal (Solar terbakar berlebihan)
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Revan Maulana') ORDER BY start_time DESC LIMIT 1),
  'speed_anomaly',
  'medium',
  'open',
  'DT-04 melaju melebihi 110 km/jam selama 34 menit di jalur Kendari-Moramo. Konsumsi solar 2.3x lipat normal. Total kerugian solar estimasi 18L akibat overspeed.',
  '{"max_speed_kmh": 118, "avg_overspeed_kmh": 112, "duration_overspeed_minutes": 34, "normal_consumption_rate_per_100km": 25, "actual_consumption_rate": 57.5, "extra_fuel_wasted_liters": 18, "road_section": "Kendari-Moramo Km 22-38", "alerts_triggered": 5}',
  NOW() - INTERVAL '1 hour'
);

-- ALERT 5 - AKRAM: Engine Idle Berlebihan (Pemborosan solar)
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Akram Hidayat') ORDER BY start_time DESC LIMIT 1),
  'excessive_idle',
  'medium',
  'resolved',
  'DT-05 membiarkan mesin menyala selama 2.5 jam tanpa pergerakan di Rest Area Wua-wua. Konsumsi solar saat idle: 32L. Kerugian operasional diestimasi Rp 480.000.',
  '{"idle_duration_minutes": 150, "idle_location": "Rest Area Wua-wua", "fuel_consumed_idle": 32, "estimated_loss_idr": 480000, "engine_temp_normal": true, "ac_on": true, "driver_action": "istirahat tidak terjadwal", "policy_max_idle_minutes": 30}',
  NOW() - INTERVAL '3 hours'
);

-- ALERT 6 - FARIS: Manipulasi Odometer
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Faris Alfarizi') ORDER BY start_time DESC LIMIT 1),
  'odometer_fraud',
  'critical',
  'open',
  'Sistem GPS mendeteksi jarak tempuh nyata DT-06 hanya 47 km, namun laporan manual driver mencatat 89 km. Selisih 42 km diduga untuk klaim solar berlebih senilai Rp 630.000.',
  '{"gps_distance_km": 47, "reported_distance_km": 89, "discrepancy_km": 42, "fuel_overclaim_liters": 42, "estimated_fraud_idr": 630000, "route": "Kendari-Torobulu", "gps_checkpoints": 12, "inconsistent_checkpoints": 4, "evidence_type": "GPS vs manual log"}',
  NOW() - INTERVAL '5 hours'
);

-- ALERT 7 - MADAN: Pengurasan Solar (Fuel Siphoning)
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Madan Saputra') ORDER BY start_time DESC LIMIT 1),
  'fuel_siphoning',
  'critical',
  'open',
  'Diduga terjadi pengurasan solar manual pada DT-07. Sensor mendeteksi penurunan drastis 70L dalam 8 menit saat kendaraan berhenti di area gelap Jl. By Pass Km 7. Pola konsisten dengan selang penguras.',
  '{"fuel_drop_liters": 70, "drop_duration_minutes": 8, "drop_rate_liters_per_minute": 8.75, "normal_rate_liters_per_minute": 0.05, "vehicle_status": "parked", "location": "Jl. By Pass Km 7", "lighting_condition": "dark", "time": "22:47 WITA", "evidence_photos": 0, "suspected_tool": "siphon hose"}',
  NOW() - INTERVAL '8 hours'
);

-- ALERT 8 - ASRI: Berhenti di Zona Larangan
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Asri Nugroho') ORDER BY start_time DESC LIMIT 1),
  'unauthorized_stop',
  'high',
  'investigating',
  'DT-08 berhenti 2x di zona merah (area rawan transaksi solar ilegal) masing-masing 25 dan 40 menit. Total solar yang tidak bisa dipertanggungjawabkan: 22L.',
  '{"unauthorized_stops": 2, "stop_locations": ["Pasar Lama Wua-wua", "Gudang Biru Abadi"], "stop_durations_minutes": [25, 40], "unaccounted_fuel_liters": 22, "zone_classification": "red_zone", "previous_violations": 1, "camera_available": false, "contact_attempts": 2}',
  NOW() - INTERVAL '7 hours'
);

-- ALERT 9 - FATIR: Konsumsi Solar Abnormal (Efisiensi Rendah)
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Fatir Ramadhan') ORDER BY start_time DESC LIMIT 1),
  'abnormal_consumption',
  'high',
  'open',
  'DT-09 menghabiskan 95L solar untuk rute 120 km (Kendari-Unaaha), padahal standar normal adalah 35-40L. Selisih 55-60L tidak dapat dijelaskan. Kemungkinan kombinasi kebocoran dan penjualan solar.',
  '{"actual_consumption_liters": 95, "expected_consumption_liters": 38, "excess_liters": 57, "route_km": 120, "efficiency_ratio": 0.4, "normal_efficiency": 0.32, "fuel_cost_actual_idr": 1425000, "fuel_cost_expected_idr": 570000, "loss_idr": 855000, "vehicle_condition": "perlu servis", "last_maintenance": "45 hari lalu"}',
  NOW() - INTERVAL '30 minutes'
);

-- ALERT 10 - FADLAN: Pemalsuan Struk SPBU
INSERT INTO alerts (
  trip_id, fraud_type, severity, status, description, evidence_data, created_at
) VALUES (
  (SELECT id FROM trips WHERE driver_id = (SELECT id FROM drivers WHERE name = 'Fadlan Setiawan') ORDER BY start_time DESC LIMIT 1),
  'receipt_fraud',
  'critical',
  'open',
  'DT-10 mengklaim pengisian 120L solar dengan struk SPBU Pertamina. Namun data GPS menunjukkan kendaraan tidak pernah singgah di SPBU manapun hari ini. Struk diduga palsu. Kerugian Rp 1.800.000.',
  '{"claimed_refuel_liters": 120, "claimed_location": "SPBU Pertamina 7416301", "gps_near_spbu": false, "nearest_spbu_distance_km": 6.8, "vehicle_stopped_at_spbu": false, "receipt_amount_idr": 1800000, "actual_fuel_level_start": 80, "actual_fuel_level_end": 78, "evidence": "GPS track vs receipt timestamp mismatch", "fraud_confidence": "95%"}',
  NOW() - INTERVAL '15 minutes'
);

-- ============================================================
-- 3.5 SYNC HULL NUMBERS IN DESCRIPTIONS DYNAMICALLY
-- ============================================================
-- Query ini mencocokkan kode DT-XX di deskripsi dengan nomor lambung truk yang sebenarnya
UPDATE alerts a
SET description = REGEXP_REPLACE(
  REGEXP_REPLACE(a.description, 'DT-\d+', v.hull_number, 'g'),
  'DT-\d+', v.hull_number, 'g'
)
FROM trips t
JOIN vehicles v ON v.id = t.vehicle_id
WHERE t.id = a.trip_id;

-- ============================================================
-- 4. VERIFIKASI DATA
-- ============================================================
SELECT 
  a.id,
  a.fraud_type,
  a.severity,
  a.status,
  d.name as driver_name,
  v.hull_number,
  LEFT(a.description, 60) as desc_preview,
  a.created_at
FROM alerts a
LEFT JOIN trips t ON t.id = a.trip_id
LEFT JOIN drivers d ON d.id = t.driver_id
LEFT JOIN vehicles v ON v.id = t.vehicle_id
ORDER BY a.created_at DESC;

-- ============================================================
-- SELESAI! 10 alert anomali berhasil dibuat.
-- Tipe kasus yang ada:
-- 1. fuel_leak        - Kebocoran solar (Arya)
-- 2. route_deviation  - Deviasi rute (Jefry)
-- 3. unauthorized_refuel - Isi solar tidak resmi (Agum)
-- 4. speed_anomaly    - Kecepatan berlebih (Revan)
-- 5. excessive_idle   - Mesin idle berlebihan (Akram)
-- 6. odometer_fraud   - Manipulasi odometer (Faris)
-- 7. fuel_siphoning   - Pengurasan solar (Madan)
-- 8. unauthorized_stop - Berhenti di zona larangan (Asri)
-- 9. abnormal_consumption - Konsumsi abnormal (Fatir)
-- 10. receipt_fraud   - Pemalsuan struk SPBU (Fadlan)
-- ============================================================
