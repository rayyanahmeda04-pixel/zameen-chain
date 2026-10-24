import { neon } from '@neondatabase/serverless';
import { ethers } from 'ethers';

const databaseUrl = 'postgresql://neondb_owner:npg_TYzon4aR2mDW@ep-super-hill-b3b4bb9v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const sql = neon(databaseUrl);

  // 1. Give dhanraj (id 8) a distinct wallet and reset status to PENDING_APPROVAL so admin can approve
  const dhanrajWallet = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"; // Hardhat Account 4
  await sql`
    UPDATE users 
    SET wallet_address = ${dhanrajWallet}, status = 'PENDING_APPROVAL' 
    WHERE email = 'dhanraj@gmail.com'
  `;
  console.log("✅ dhanraj (dhanraj@gmail.com) wallet updated to", dhanrajWallet, "and reset to PENDING_APPROVAL");

  // 2. Also ensure dhanraj2 has a distinct wallet if it exists
  const dhanraj2Wallet = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"; // Hardhat Account 5
  await sql`
    UPDATE users 
    SET wallet_address = ${dhanraj2Wallet}
    WHERE email = 'dhanraj2@gmail.com'
  `;
  console.log("✅ dhanraj2 wallet updated to", dhanraj2Wallet);

  // Print current list
  const users = await sql`SELECT id, name, email, role, status, wallet_address FROM users WHERE role = 'REGISTRAR'`;
  console.log("Current Registrars in Neon:");
  console.table(users);
}

main().catch(console.error);
