import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDatabaseUrl() {
  if (process.env.VITE_NEON_DATABASE_URL) return process.env.VITE_NEON_DATABASE_URL;
  const envPath = path.join(__dirname, '..', 'frontend', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/VITE_NEON_DATABASE_URL=(.+)/);
    if (match && match[1]) return match[1].trim();
  }
  throw new Error('VITE_NEON_DATABASE_URL is not configured in environment or frontend/.env');
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();
  console.log('Connecting to Neon Serverless PostgreSQL...');
  const sql = neon(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      cnic VARCHAR(50),
      badge_number VARCHAR(100),
      department VARCHAR(255),
      wallet_address VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`;
  await sql`
    ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'REGISTRAR', 'SELLER', 'BUYER'));
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';`;

  await sql`
    INSERT INTO users (name, email, password, role, status, cnic, badge_number, department, wallet_address)
    VALUES
    (
      'Rayyan Ahmed',
      'rayyan.ahmed@sindh.gov.pk',
      'password123',
      'ADMIN',
      'ACTIVE',
      '42101-5555555-1',
      'SINDH-CHIEF-ADMIN-01',
      'Ministry of Revenue & Land Reforms, Government of Sindh',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    ),
    (
      'Engr. Tariq Mansoor',
      'tariq.mansoor@kda.gos.pk',
      'password123',
      'REGISTRAR',
      'ACTIVE',
      '42101-1122334-5',
      'KDA-SR-001',
      'KDA Civic Centre - Directorate of Land Management',
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
    ),
    (
      'Khurram Shahzad (Applicant)',
      'khurram.shahzad@kda.gos.pk',
      'password123',
      'REGISTRAR',
      'PENDING_APPROVAL',
      '42201-9988776-3',
      'KDA-APPLICANT-892',
      'KDA Surjani Town Sub-Registry Division',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
    ),
    (
      'Aamir Khan',
      'aamir.khan@gmail.com',
      'password123',
      'SELLER',
      'ACTIVE',
      '42101-9876543-1',
      NULL,
      NULL,
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    ),
    (
      'Bilal Siddiqui',
      'bilal.siddiqui@gmail.com',
      'password123',
      'SELLER',
      'ACTIVE',
      '42301-7654321-9',
      NULL,
      NULL,
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ),
    (
      'Hamza Sheikh',
      'hamza.sheikh@gmail.com',
      'password123',
      'BUYER',
      'ACTIVE',
      '42201-1234567-3',
      NULL,
      NULL,
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
    )
    ON CONFLICT (email) DO NOTHING;
  `;

  // Dual-signature separation of duties: KDA Sub-Registrar must hold a different key
  // from the Chief Admin / Board of Revenue countersigner.
  await sql`
    UPDATE users SET wallet_address = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
    WHERE LOWER(email) = 'tariq.mansoor@kda.gos.pk';
  `;

  const allUsers = await sql`SELECT id, name, email, role, status, wallet_address FROM users ORDER BY id ASC`;
  console.log('✅ Neon PostgreSQL synchronized! Active records:', allUsers.length);
  console.table(allUsers);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
