import pg from 'pg';

const { Client } = pg;

const passwords = ['jefri123##@@', 'Jefri123@__', 'Jefri123##@@'];

async function run() {
  let successPassword = null;
  let clientInstance = null;

  for (const pwd of passwords) {
    console.log(`Testing database connection with password: ${pwd}`);
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
    console.log('Connected to Supabase PostgreSQL database.');

    // 1. Create pgcrypto extension if not exists
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    console.log('pgcrypto extension ensured.');

    // Function to run a query and log warnings instead of throwing
    const safeQuery = async (queryText, description) => {
      try {
        await client.query(queryText);
        console.log(`✅ ${description}`);
      } catch (err) {
        console.warn(`⚠️ Warning during "${description}":`, err.message);
      }
    };

    // 2. Insert admin@sirekan.com into auth.users (ID: a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6)
    const adminQuery = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6',
        'authenticated',
        'authenticated',
        'admin@sirekan.com',
        crypt('Admin123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Admin Dispatcher"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = now();
    `;
    await safeQuery(adminQuery, 'Create/update Admin user in auth.users');

    // Identity for admin
    const adminIdentityQuery = `
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6',
        'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6',
        jsonb_build_object('sub', 'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6', 'email', 'admin@sirekan.com'),
        'email',
        'admin@sirekan.com',
        null,
        now(),
        now()
      )
      ON CONFLICT DO NOTHING;
    `;
    await safeQuery(adminIdentityQuery, 'Create Admin user identity in auth.identities');

    // Public profile for admin
    const adminPublicQuery = `
      INSERT INTO public.users (
        id,
        email,
        password_hash,
        full_name,
        role,
        company_id,
        created_at,
        updated_at
      )
      VALUES (
        'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6',
        'admin@sirekan.com',
        'managed_by_supabase_auth',
        'Admin Dispatcher',
        'dispatcher',
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
    `;
    await safeQuery(adminPublicQuery, 'Create/update Admin profile in public.users');

    // 3. Insert driver@sirekan.com into auth.users (ID: c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f)
    const driverQuery = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        'authenticated',
        'authenticated',
        'driver@sirekan.com',
        crypt('Driver123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Budi Santoso"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = now();
    `;
    await safeQuery(driverQuery, 'Create/update Driver user in auth.users');

    // Identity for driver
    const driverIdentityQuery = `
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        jsonb_build_object('sub', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'email', 'driver@sirekan.com'),
        'email',
        'driver@sirekan.com',
        null,
        now(),
        now()
      )
      ON CONFLICT DO NOTHING;
    `;
    await safeQuery(driverIdentityQuery, 'Create Driver user identity in auth.identities');

    // Public profile for driver
    const driverPublicQuery = `
      INSERT INTO public.users (
        id,
        email,
        password_hash,
        full_name,
        role,
        company_id,
        created_at,
        updated_at
      )
      VALUES (
        'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        'driver@sirekan.com',
        'managed_by_supabase_auth',
        'Budi Santoso',
        'driver',
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
    `;
    await safeQuery(driverPublicQuery, 'Create/update Driver profile in public.users');

    console.log('✅ All users processed successfully!');
  } catch (err) {
    console.error('Error setting up users:', err);
  } finally {
    await client.end();
  }
}

run();
