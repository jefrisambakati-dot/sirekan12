const fs = require("fs");
const pg = require("pg");
const { Client } = pg;

const passwords = ['jefri123##@@', 'Jefri123@__', 'Jefri123##@@'];

async function run() {
  let client = null;

  async function connectDB() {
    for (const pwd of passwords) {
      const c = new Client({
        host: 'aws-1-ap-northeast-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.jquildkylqapabwkbyee',
        password: pwd,
        ssl: { rejectUnauthorized: false }
      });
      try {
        await c.connect();
        client = c;
        console.log(`✅ Simulation engine connected to Supabase (pwd: ${pwd.substring(0, 4)}***).`);
        
        // Listen to connection errors
        client.on('error', async (err) => {
          console.error('⚠️ DB Connection error:', err.message);
          await reconnect();
        });
        
        return true;
      } catch (err) {
        await c.end().catch(() => {});
      }
    }
    return false;
  }

  async function reconnect() {
    console.log('🔄 Reconnecting to Supabase database...');
    if (client) {
      try { await client.end(); } catch (e) {}
      client = null;
    }
    let success = false;
    while (!success) {
      success = await connectDB();
      if (!success) {
        console.log('❌ Reconnect failed. Retrying in 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to database on startup.');
    process.exit(1);
  }

  let isRunning = false;

  async function step() {
    if (isRunning) return;
    if (!client) return;
    
    isRunning = true;
    try {
      // 1. Get all active trips with their routes polyline
      const { rows: trips } = await client.query(
        `SELECT t.id, t.fuel_before_liter, d.name as driver_name, v.hull_number, r.polyline, r.name as route_name
         FROM trips t
         JOIN drivers d ON t.driver_id = d.id
         JOIN vehicles v ON t.vehicle_id = v.id
         JOIN routes r ON t.route_id = r.id
         WHERE t.status = 'in_progress'`
      );

      if (trips.length === 0) {
        console.log('No active trips found. Waiting for a driver to start a trip...');
        isRunning = false;
        return;
      }

      for (const trip of trips) {
        let polyline = trip.polyline;
        if (typeof polyline === 'string') {
          polyline = JSON.parse(polyline);
        }
        
        if (!polyline || !Array.isArray(polyline) || polyline.length === 0) {
          polyline = [
            [122.5204, -3.9671],
            [122.5137, -3.9772],
            [122.5001, -3.9877],
            [122.5281, -4.0120],
            [122.5420, -4.0345]
          ];
        }

        const { rows: gpsPoints } = await client.query(
          `SELECT COUNT(*)::int as count FROM gps_data WHERE trip_id = $1`,
          [trip.id]
        );
        const count = gpsPoints[0].count;

        if (count >= polyline.length) {
          console.log(`Trip ${trip.id} for driver ${trip.driver_name} has arrived at destination. Marking as completed.`);
          await client.query(
            `UPDATE trips SET status = 'completed', end_time = NOW(), fuel_after_liter = $2 WHERE id = $1`,
            [trip.id, parseFloat((trip.fuel_before_liter || 250) - (polyline.length * 4.8)).toFixed(2)]
          );
          continue;
        }

        const nextCoord = polyline[count];
        const nextLat = nextCoord[1] + (Math.random() - 0.5) * 0.0001;
        const nextLng = nextCoord[0] + (Math.random() - 0.5) * 0.0001;
        const speed = count === 0 ? 0 : 35 + Math.random() * 20;
        const segmentName = `Segmen ${count + 1} - Rute ${trip.route_name.replace('Rute ', '')}`;

        console.log(`Moving vehicle ${trip.hull_number} (${trip.driver_name}) to ${segmentName} [${nextLng.toFixed(4)}, ${nextLat.toFixed(4)}].`);

        await client.query(
          `INSERT INTO gps_data (id, trip_id, latitude, longitude, speed_kmh, is_geofence_official, recorded_at, location_name)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), $5)`,
          [trip.id, nextLat, nextLng, speed, segmentName]
        );

        let currentFuel = parseFloat(trip.fuel_before_liter || 250) - (count * 4.8);
        let capStatus = 'CLOSED';
        
        if (count === 2 && (trip.driver_name === 'arya' || trip.driver_name.includes('arya'))) {
          console.log(`⚠️ Simulating fuel theft event for ${trip.driver_name}!`);
          currentFuel -= 35.0;
          capStatus = 'OPEN';

          const { rows: alerts } = await client.query(
            `SELECT COUNT(*)::int as count FROM alerts WHERE trip_id = $1 AND fraud_type = 'fuel_theft'`,
            [trip.id]
          );
          if (alerts[0].count === 0) {
            await client.query(
              `INSERT INTO alerts (id, trip_id, fraud_type, severity, status, description, evidence_data, created_at)
               VALUES (gen_random_uuid(), $1, 'fuel_theft', 'critical', 'open', 
                       'Deteksi pencurian solar sebesar 35 Liter ketika kendaraan berhenti di luar geofence.', 
                       '{"loss_liter": 35, "duration_seconds": 300}'::jsonb, NOW())`,
              [trip.id]
            );
          }
        }

        currentFuel = Math.max(0, currentFuel);

        await client.query(
          `INSERT INTO fuel_sensor_data (id, trip_id, fuel_level_liter, fuel_cap_status, temperature_celsius, recorded_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
          [trip.id, parseFloat(currentFuel.toFixed(2)), capStatus, 34.0 + Math.random()]
        );
      }

      await client.query("NOTIFY pgrst, 'reload schema'");
    } catch (err) {
      console.error('Error in simulation step:', err.message);
      if (err.message.includes('Connection') || err.message.includes('terminated') || err.message.includes('closed')) {
        await reconnect();
      }
    } finally {
      isRunning = false;
    }
  }

  setInterval(step, 5000);
  step();
}

run();
