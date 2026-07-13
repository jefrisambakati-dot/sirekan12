import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.jquildkylqapabwkbyee',
  password: 'Jefri123@__',
  ssl: {
    rejectUnauthorized: false
  }
});

const passwords = ['Jefri123@__', 'jefri123##@@', 'Jefri123##@@'];

async function run() {
  let successPassword = null;
  let clientInstance = null;

  for (const pwd of passwords) {
    console.log(`Testing connection with password: ${pwd}`);
    clientInstance = new Client({
      host: 'aws-1-ap-northeast-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.jquildkylqapabwkbyee',
      password: pwd,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await clientInstance.connect();
      console.log(`✅ Success with password: ${pwd}`);
      successPassword = pwd;
      break;
    } catch (err) {
      console.log(`❌ Failed with password ${pwd}:`, err.message);
      await clientInstance.end().catch(() => {});
    }
  }

  if (!successPassword) {
    console.error('❌ None of the passwords succeeded.');
    return;
  }

  const client = clientInstance;
  try {
    // Read and run schema
    const schemaPath = path.join(__dirname, '..', '..', 'schema_postgresql.sql');
    console.log('Reading schema from:', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema_postgresql.sql...');
    await client.query(schemaSql);
    console.log('✅ Schema executed successfully!');

    // Disable Row Level Security (RLS) on all tables for easy development access
    console.log('Disabling RLS on all tables...');
    const tables = [
      'companies', 'users', 'vehicles', 'drivers', 'routes', 'trips',
      'weight_scale_data', 'gps_data', 'fuel_sensor_data',
      'reconciliation_results', 'alerts', 'notifications',
      'investigation_logs', 'reports', 'audit_log'
    ];
    for (const table of tables) {
      await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }
    console.log('✅ RLS disabled successfully!');

    // Read and run seed
    const seedPath = path.join(__dirname, '..', '..', 'seed.sql');
    console.log('Reading seed from:', seedPath);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Running seed.sql...');
    await client.query(seedSql);
    console.log('✅ Seed data executed successfully!');

    // Reload PostgREST schema cache
    console.log('Reloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ PostgREST schema cache reloaded!');

  } catch (err) {
    console.error('❌ Error running SQL:', err);
  } finally {
    await client.end();
  }
}

run();
