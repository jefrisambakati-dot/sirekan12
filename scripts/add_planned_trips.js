import pg from 'pg';

const { Client } = pg;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
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
      break;
    } catch (e) {
      await c.end().catch(() => {});
    }
  }

  if (!client) { console.error('❌ Database connection failed'); return; }

  try {
    // Ambil data driver, vehicle, dan route yang ada
    const { rows: drivers } = await client.query('SELECT id, name FROM drivers');
    const { rows: vehicles } = await client.query('SELECT id, hull_number FROM vehicles');
    const { rows: routes } = await client.query('SELECT id, name FROM routes');

    console.log(`Menambahkan 1 rencana perjalanan ('planned') untuk masing-masing dari ${drivers.length} supir...`);

    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const vehicle = vehicles[i % vehicles.length];
      const route = routes[i % routes.length];
      const tripId = uuid();

      // Hapus trip 'planned' lama untuk supir ini jika ada agar bersih
      await client.query(`DELETE FROM trips WHERE driver_id = $1 AND status = 'planned'`, [driver.id]);

      // Insert trip dengan status 'planned'
      await client.query(
        `INSERT INTO trips (id, vehicle_id, driver_id, route_id, start_time, status, fuel_before_liter)
         VALUES ($1, $2, $3, $4, NOW(), 'planned', 200)`,
        [tripId, vehicle.id, driver.id, route.id]
      );
      console.log(`✓ Rencana Perjalanan ditambahkan untuk: ${driver.name} (Truk: ${vehicle.hull_number})`);
    }

    console.log('\n🎉 Selesai! Semua supir sekarang memiliki rencana perjalanan baru yang siap dijalankan.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

run();
