import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_TYzon4aR2mDW@ep-super-hill-b3b4bb9v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  console.log("Connecting to Neon PostgreSQL...");
  const sql = neon(databaseUrl);

  console.log("Creating 'users' table in Neon if not exists...");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'REGISTRAR')),
      cnic VARCHAR(50),
      badge_number VARCHAR(100),
      department VARCHAR(255),
      wallet_address VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✅ 'users' table created successfully in Neon!");

  console.log("Seeding verified initial accounts into Neon...");
  await sql`
    INSERT INTO users (name, email, password, role, cnic, badge_number, department, wallet_address)
    VALUES
    (
      'Tariq Mansoor',
      'tariq.mansoor@kda.gos.pk',
      'password123',
      'REGISTRAR',
      '42101-1122334-5',
      'KDA-SR-001',
      'KDA Civic Centre - Directorate of Land Management',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    ),
    (
      'Aamir Khan',
      'aamir.khan@gmail.com',
      'password123',
      'SELLER',
      '42101-9876543-1',
      NULL,
      NULL,
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    ),
    (
      'Hamza Sheikh',
      'hamza.sheikh@gmail.com',
      'password123',
      'BUYER',
      '42201-1234567-3',
      NULL,
      NULL,
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
    )
    ON CONFLICT (email) DO NOTHING;
  `;
  console.log("✅ Seed accounts inserted!");

  const allUsers = await sql`SELECT id, name, email, role, badge_number FROM users`;
  console.log("Current Users in Neon Database:");
  console.table(allUsers);
}

main().catch(console.error);
