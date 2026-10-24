import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_TYzon4aR2mDW@ep-super-hill-b3b4bb9v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  console.log("Updating Neon PostgreSQL schema for Chief Admin...");
  const sql = neon(databaseUrl);

  // 1. Update check constraint to allow 'ADMIN' role
  await sql`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  `;
  await sql`
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('BUYER', 'SELLER', 'REGISTRAR', 'ADMIN'));
  `;
  console.log("✅ Check constraint updated to include 'ADMIN'!");

  // 2. Add status column if it doesn't exist
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
  `;
  console.log("✅ Column 'status' verified in users table.");

  // 3. Insert Chief Admin (Rayyan Ahmed)
  await sql`
    INSERT INTO users (name, email, password, role, cnic, badge_number, department, wallet_address, status)
    VALUES (
      'Rayyan Ahmed',
      'rayyan.ahmed@sindh.gov.pk',
      'password123',
      'ADMIN',
      '42101-5555555-1',
      'SINDH-CHIEF-ADMIN-01',
      'Ministry of Revenue & Land Reforms, Government of Sindh',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE SET 
      name = EXCLUDED.name,
      role = 'ADMIN',
      status = 'ACTIVE';
  `;
  console.log("✅ Chief Admin (Rayyan Ahmed) successfully inserted into Neon DB!");

  // 4. Insert a sample pending registrar applicant for immediate demo testing
  await sql`
    INSERT INTO users (name, email, password, role, cnic, badge_number, department, wallet_address, status)
    VALUES (
      'Khurram Shahzad (Applicant)',
      'khurram.shahzad@kda.gos.pk',
      'password123',
      'REGISTRAR',
      '42201-9988776-3',
      'KDA-APPLICANT-892',
      'KDA Surjani Town Sub-Registry Office',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      'PENDING_APPROVAL'
    )
    ON CONFLICT (email) DO UPDATE SET
      status = 'PENDING_APPROVAL';
  `;
  console.log("✅ Sample Pending Registrar applicant created for demonstration!");

  const allUsers = await sql`SELECT id, name, email, role, status FROM users`;
  console.log("Updated Users in Neon Database:");
  console.table(allUsers);
}

main().catch(console.error);
