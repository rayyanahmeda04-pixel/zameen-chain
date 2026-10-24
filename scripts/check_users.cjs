const { neon } = require('@neondatabase/serverless');

const connectionString = "postgresql://neondb_owner:npg_TYzon4aR2mDW@ep-super-hill-b3b4bb9v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function main() {
  const users = await sql`SELECT id, name, email, role, status, badge_number, wallet_address FROM users ORDER BY created_at ASC`;
  console.log("Current Users in Neon DB:");
  console.log(users);
}

main().catch(console.error);
