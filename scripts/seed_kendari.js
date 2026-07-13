/**
 * seed_kendari.js
 * Hapus semua data dummy lama dan isi ulang dengan:
 * - 10 kendaraan berbeda (DT-01 s/d DT-10)
 * - 10 supir berbeda
 * - GPS tersebar di 10 lokasi unik di kota Kendari
 * - Data sensor solar + alert kecurangan yang bervariasi
 */
import pg from 'pg';

const { Client } = pg;

// ── Lokasi GPS di dalam kota Kendari ──────────────────────────────────────
const KENDARI_LOCATIONS = [
  { name: 'Pelabuhan Nusantara Kendari', lat: -3.9671, lng: 122.5204 },
  { name: 'Pusat Kota Kendari',          lat: -3.9772, lng: 122.5137 },
  { name: 'Mandonga',                    lat: -3.9877, lng: 122.5001 },
  { name: 'Anduonohu',                   lat: -4.0120, lng: 122.5281 },
  { name: 'Poasia',                      lat: -4.0345, lng: 122.5420 },
  { name: 'Baruga',                      lat: -4.0012, lng: 122.5612 },
  { name: 'Wua-Wua',                     lat: -3.9960, lng: 122.5089 },
  { name: 'Kemaraya',                    lat: -3.9840, lng: 122.4892 },
  { name: 'Lepo-Lepo',                   lat: -4.0230, lng: 122.5156 },
  { name: 'Abeli',                       lat: -3.9650, lng: 122.5720 },
];

// ── 10 pasang titik rute (origin → destination) di Kendari ────────────────
const ROUTE_PAIRS = [
  [0, 4], [1, 5], [2, 6], [3, 7], [4, 8], [5, 9],
  [6, 0], [7, 1], [8, 2], [9, 3],
];

const DRIVERS = [
  { name: 'arya',    license: 'SIM-A-001', qr: 'qr_arya_01' },
  { name: 'jefry',   license: 'SIM-A-002', qr: 'qr_jefry_02' },
  { name: 'agum',    license: 'SIM-A-003', qr: 'qr_agum_03' },
  { name: 'revan',   license: 'SIM-A-004', qr: 'qr_revan_04' },
  { name: 'akram',   license: 'SIM-A-005', qr: 'qr_akram_05' },
  { name: 'faris',   license: 'SIM-A-006', qr: 'qr_faris_06' },
  { name: 'madan',   license: 'SIM-A-007', qr: 'qr_madan_07' },
  { name: 'asri',    license: 'SIM-A-008', qr: 'qr_asri_08' },
  { name: 'fatir',   license: 'SIM-A-009', qr: 'qr_fatir_09' },
  { name: 'fadlan',  license: 'SIM-A-010', qr: 'qr_fadlan_10' },
];

const VEHICLES = [
  { hull: 'DT-01', plate: 'DT 1001 AA' },
  { hull: 'DT-02', plate: 'DT 1002 AB' },
  { hull: 'DT-03', plate: 'DT 1003 AC' },
  { hull: 'DT-04', plate: 'DT 1004 AD' },
  { hull: 'DT-05', plate: 'DT 1005 AE' },
  { hull: 'DT-06', plate: 'DT 1006 AF' },
  { hull: 'DT-07', plate: 'DT 1007 AG' },
  { hull: 'DT-08', plate: 'DT 1008 AH' },
  { hull: 'DT-09', plate: 'DT 1009 AI' },
  { hull: 'DT-10', plate: 'DT 1010 AJ' },
];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function jitter(val, range = 0.003) {
  return val + (Math.random() - 0.5) * 2 * range;
}

function interpolate(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

// Generate 8 GPS waypoints between two locations
function buildPath(origin, dest, isFraud, fraudType) {
  const pts = [];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const base = interpolate(origin, dest, t);
    let lat = jitter(base.lat, 0.002);
    let lng = jitter(base.lng, 0.002);

    // Route deviation: push off-path at mid-trip
    if (isFraud && fraudType === 'route_deviation' && i >= 2 && i <= 5) {
      lat += 0.008;
      lng -= 0.009;
    }

    pts.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      speed: i === 0 ? 0 : parseFloat((30 + Math.random() * 30).toFixed(1)),
      geofence: !(isFraud && fraudType === 'route_deviation' && i >= 2 && i <= 5),
      locName: i === 0 ? origin.name : i === 7 ? dest.name : `Jalan Raya ${i}`,
    });
  }
  return pts;
}

async function run() {
  const passwords = ['jefri123##@@', 'Jefri123@__'];
  let client;

  for (const pwd of passwords) {
    const c = new Client({
      host: 'aws-1-ap-northeast-1.pooler.supabase.com',
      port: 5432, database: 'postgres',
      user: 'postgres.jquildkylqapabwkbyee',
      password: pwd, ssl: { rejectUnauthorized: false }
    });
    try {
      await c.connect();
      client = c;
      console.log(`✅ Connected (pwd: ${pwd})`);
      break;
    } catch (e) {
      await c.end().catch(() => {});
    }
  }

  if (!client) { console.error('❌ No password worked'); return; }

  try {
    // ── 1. Ambil/buat company ──────────────────────────────────────
    const { rows: companies } = await client.query(
      `INSERT INTO companies (id, name, location)
       VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'PT Trans Sultra Logistics', 'Kendari, Sulawesi Tenggara')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const companyId = companies[0].id;
    console.log('✅ Company OK');

    // ── 2. Bersihkan data dummy lama ────────────────────────────────
    console.log('🧹 Membersihkan data lama...');
    const { rows: oldVehicles } = await client.query(
      `SELECT id FROM vehicles WHERE company_id = $1`, [companyId]
    );
    const oldVehicleIds = oldVehicles.map(v => v.id);

    if (oldVehicleIds.length > 0) {
      const { rows: oldTrips } = await client.query(
        `SELECT id FROM trips WHERE vehicle_id = ANY($1::uuid[])`,
        [oldVehicleIds]
      );
      const oldTripIds = oldTrips.map(t => t.id);

      if (oldTripIds.length > 0) {
        await client.query(`DELETE FROM alerts WHERE trip_id = ANY($1::uuid[])`, [oldTripIds]);
        await client.query(`DELETE FROM fuel_sensor_data WHERE trip_id = ANY($1::uuid[])`, [oldTripIds]);
        await client.query(`DELETE FROM gps_data WHERE trip_id = ANY($1::uuid[])`, [oldTripIds]);
        await client.query(`DELETE FROM reconciliation_results WHERE trip_id = ANY($1::uuid[])`, [oldTripIds]);
        await client.query(`DELETE FROM weight_scale_data WHERE trip_id = ANY($1::uuid[])`, [oldTripIds]);
        await client.query(`DELETE FROM trips WHERE id = ANY($1::uuid[])`, [oldTripIds]);
      }
      await client.query(`DELETE FROM drivers WHERE company_id = $1`, [companyId]);
      await client.query(`DELETE FROM vehicles WHERE company_id = $1`, [companyId]);
      await client.query(`DELETE FROM routes WHERE company_id = $1`, [companyId]);
    }
    console.log('🧹 Bersih');

    // ── 3. Buat 10 kendaraan ────────────────────────────────────────
    const vehicleIds = [];
    for (const v of VEHICLES) {
      const vId = uuid();
      await client.query(
        `INSERT INTO vehicles (id, company_id, hull_number, plate_number, vehicle_type, fuel_tank_capacity, status)
         VALUES ($1,$2,$3,$4,'truck',300,'active')`,
        [vId, companyId, v.hull, v.plate]
      );
      vehicleIds.push(vId);
    }
    console.log('✅ 10 Kendaraan DT-01..DT-10 dibuat');

    // ── 4. Buat 10 supir ────────────────────────────────────────────
    const driverIds = [];
    for (const d of DRIVERS) {
      const dId = uuid();
      await client.query(
        `INSERT INTO drivers (id, company_id, name, license_number, qr_token, status)
         VALUES ($1,$2,$3,$4,$5,'active')
         ON CONFLICT (license_number) DO UPDATE SET name = EXCLUDED.name, qr_token = EXCLUDED.qr_token`,
        [dId, companyId, d.name, d.license, d.qr]
      );
      driverIds.push(dId);
    }
    console.log('✅ 10 Supir dibuat');

    // ── 5. Buat 10 rute dengan polyline (rute terbaik) ──────────────
    const routeIds = [];
    for (let i = 0; i < 10; i++) {
      const [oi, di] = ROUTE_PAIRS[i];
      const orig = KENDARI_LOCATIONS[oi];
      const dest = KENDARI_LOCATIONS[di];
      const rId = uuid();
      const dist = parseFloat((Math.random() * 8 + 5).toFixed(2));
      
      // Buat 15 koordinat rute terbaik (polylines)
      const polyCoords = [];
      for (let j = 0; j <= 12; j++) {
        const t = j / 12;
        const base = interpolate(orig, dest, t);
        // Tambahkan jitter kecil agar polylines terlihat realistis berliku di jalan raya Kendari
        polyCoords.push([
          parseFloat(jitter(base.lng, 0.0012).toFixed(6)),
          parseFloat(jitter(base.lat, 0.0012).toFixed(6))
        ]);
      }

      await client.query(
        `INSERT INTO routes (id, company_id, name, source_location, destination_location, distance_km, polyline)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [rId, companyId, `Rute ${orig.name} → ${dest.name}`, orig.name, dest.name, dist, JSON.stringify(polyCoords)]
      );
      routeIds.push(rId);
    }
    console.log('✅ 10 Rute dengan polyline dibuat');

    // ── 6. Buat 10 trip aktif + GPS + sensor solar ──────────────────
    const FRAUD_DRIVERS = new Set([2, 5, 8]); // index 2,5,8 = driver 3,6,9 akan fraud
    const FRAUD_TYPES   = ['fuel_theft', 'route_deviation', 'weight_manipulation'];

    for (let i = 0; i < 10; i++) {
      const tripId = uuid();
      const isFraud = FRAUD_DRIVERS.has(i);
      const fraudType = isFraud ? FRAUD_TYPES[i % 3] : null;
      const [oi, di] = ROUTE_PAIRS[i];
      const orig = KENDARI_LOCATIONS[oi];
      const dest = KENDARI_LOCATIONS[di];
      const fuelStart = 250;
      const startTime = new Date(Date.now() - (i + 1) * 15 * 60 * 1000); // stagger 15 mnt

      // Buat trip
      await client.query(
        `INSERT INTO trips (id, vehicle_id, driver_id, route_id, start_time, status, fuel_before_liter)
         VALUES ($1,$2,$3,$4,$5,'in_progress',$6)`,
        [tripId, vehicleIds[i], driverIds[i], routeIds[i], startTime.toISOString(), fuelStart]
      );

      // GPS waypoints
      const path = buildPath(orig, dest, isFraud, fraudType);
      let currentFuel = fuelStart;

      for (let j = 0; j < path.length; j++) {
        const pt = path[j];
        const recAt = new Date(startTime.getTime() + j * 4 * 60 * 1000).toISOString();

        await client.query(
          `INSERT INTO gps_data (id, trip_id, latitude, longitude, speed_kmh, is_geofence_official, recorded_at, location_name)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [uuid(), tripId, pt.lat, pt.lng, pt.speed, pt.geofence, recAt, pt.locName]
        );

        // Sensor solar
        let drop = 4 + Math.random() * 2; // konsumsi normal 4-6L / waypoint
        let capStatus = 'CLOSED';

        if (isFraud && fraudType === 'fuel_theft' && j === 3) {
          drop += 35; // pencurian 35L
          capStatus = 'OPEN';
        }

        currentFuel = parseFloat(Math.max(0, currentFuel - drop).toFixed(2));

        await client.query(
          `INSERT INTO fuel_sensor_data (id, trip_id, fuel_level_liter, fuel_cap_status, temperature_celsius, recorded_at)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [uuid(), tripId, currentFuel, capStatus, parseFloat((33 + Math.random() * 3).toFixed(1)), recAt]
        );
      }

      // Alert kecurangan
      if (isFraud) {
        let desc = '';
        const evidence = {};
        if (fraudType === 'fuel_theft') {
          desc = `Deteksi penurunan solar mendadak 35L saat kendaraan berhenti di luar jalur resmi.`;
          evidence.loss_liter = 35;
        } else if (fraudType === 'route_deviation') {
          desc = `Kendaraan ${VEHICLES[i].hull} menyimpang dari rute resmi sejauh ±900m.`;
          evidence.deviation_km = 0.9;
        } else {
          desc = `Berat muatan kendaraan ${VEHICLES[i].hull} tidak sesuai manifest.`;
          evidence.weight_variance_kg = 420;
        }

        await client.query(
          `INSERT INTO alerts (id, trip_id, fraud_type, severity, status, description, evidence_data)
           VALUES ($1,$2,$3,'high','open',$4,$5::jsonb)`,
          [uuid(), tripId, fraudType, desc, JSON.stringify(evidence)]
        );
      }

      console.log(`✅ Trip #${i+1}: ${VEHICLES[i].hull} | ${DRIVERS[i].name} | ${orig.name} → ${dest.name}${isFraud ? ` | ⚠ ${fraudType}` : ''}`);
    }

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('\n🎉 Semua data dummy Kendari berhasil dibuat!');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

run();
