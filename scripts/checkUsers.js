import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_TYzon4aR2mDW@ep-super-hill-b3b4bb9v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const sql = neon(databaseUrl);
  const users = await sql`SELECT id, name, email, role, status, wallet_address FROM users ORDER BY id DESC LIMIT 10`;
  console.log("Recent Neon Users with Wallets:");
  console.table(users);
}

main().catch(console.error);
