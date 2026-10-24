const { neon } = require('@neondatabase/serverless');

const connectionString = "postgresql://neondb_owner:npg_TYzon4aR2mDW@ep-super-hill-b3b4bb9v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function main() {
  console.log("Adding KDA Registrars to Neon DB...");

  // 1. Add Active Lead Registrar: Engr. Tariq Mansoor
  const existingTariq = await sql`SELECT id, email FROM users WHERE email = 'tariq.mansoor@kda.gos.pk'`;
  if (existingTariq.length === 0) {
    await sql`
      INSERT INTO users (
        name, email, password, role, status, badge_number, department, wallet_address
      ) VALUES (
        'Engr. Tariq Mansoor (Sub-Registrar)',
        'tariq.mansoor@kda.gos.pk',
        'password123',
        'REGISTRAR',
        'ACTIVE',
        'KDA-SR-001',
        'KDA Civic Centre - Directorate of Land Management',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      )
    `;
    console.log("✅ Added Active KDA Registrar: Engr. Tariq Mansoor (tariq.mansoor@kda.gos.pk)");
  } else {
    await sql`
      UPDATE users 
      SET status = 'ACTIVE', role = 'REGISTRAR', badge_number = 'KDA-SR-001', department = 'KDA Civic Centre - Directorate of Land Management'
      WHERE email = 'tariq.mansoor@kda.gos.pk'
    `;
    console.log("Updated Tariq Mansoor to ACTIVE REGISTRAR");
  }

  // 2. Add an applicant registrar for Admin Rayyan Ahmed's vetting desk
  const existingKhurram = await sql`SELECT id, email FROM users WHERE email = 'khurram.shahzad@kda.gos.pk'`;
  if (existingKhurram.length === 0) {
    await sql`
      INSERT INTO users (
        name, email, password, role, status, badge_number, department, wallet_address
      ) VALUES (
        'Khurram Shahzad (Applicant Officer)',
        'khurram.shahzad@kda.gos.pk',
        'password123',
        'REGISTRAR',
        'PENDING_APPROVAL',
        'KDA-APPLICANT-892',
        'KDA Surjani Town Sub-Registry Division',
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
      )
    `;
    console.log("✅ Added Pending KDA Registrar Applicant: Khurram Shahzad (khurram.shahzad@kda.gos.pk)");
  } else {
    console.log("Khurram Shahzad already exists");
  }

  // List all users
  const all = await sql`SELECT id, name, email, role, status, badge_number FROM users ORDER BY id ASC`;
  console.log("\nAll Current Users in Database:");
  console.log(all);
}

main().catch(console.error);
