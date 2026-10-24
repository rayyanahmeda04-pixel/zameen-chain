import { sql, isNeonConfigured } from './neonClient';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ethers } from 'ethers';

const CURRENT_USER_KEY = "zameen_chain_current_user";
const LOCAL_USERS_KEY = "zameen_chain_users_db";
const EMERGENCY_FREEZE_KEY = "zameen_chain_emergency_freeze";

// Fallback seed accounts for offline / local mode
const DEFAULT_USERS = [
  {
    id: "usr_admin_01",
    name: "Rayyan Ahmed",
    email: "rayyan.ahmed@sindh.gov.pk",
    password: "password123",
    role: "ADMIN",
    status: "ACTIVE",
    badgeNumber: "SINDH-CHIEF-ADMIN-01",
    department: "Ministry of Revenue & Land Reforms, Government of Sindh",
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    id: "usr_reg_01",
    name: "Tariq Mansoor",
    email: "tariq.mansoor@kda.gos.pk",
    password: "password123",
    role: "REGISTRAR",
    status: "ACTIVE",
    badgeNumber: "KDA-SR-001",
    department: "KDA Civic Centre - Directorate of Land Management",
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    id: "usr_reg_pending",
    name: "Khurram Shahzad (Applicant)",
    email: "khurram.shahzad@kda.gos.pk",
    password: "password123",
    role: "REGISTRAR",
    status: "PENDING_APPROVAL",
    badgeNumber: "KDA-APPLICANT-892",
    department: "KDA Surjani Town Sub-Registry Office",
    walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  },
  {
    id: "usr_sel_01",
    name: "Aamir Khan",
    email: "aamir.khan@gmail.com",
    password: "password123",
    role: "SELLER",
    status: "ACTIVE",
    cnic: "42101-9876543-1",
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  },
  {
    id: "usr_buy_01",
    name: "Hamza Sheikh",
    email: "hamza.sheikh@gmail.com",
    password: "password123",
    role: "BUYER",
    status: "ACTIVE",
    cnic: "42201-1234567-3",
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  }
];

function getLocalUsers() {
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function getActiveDatabaseEngine() {
  if (isNeonConfigured()) return "Neon Serverless PostgreSQL";
  if (isSupabaseConfigured()) return "Supabase PostgreSQL";
  return "Local Persistent Storage (PostgreSQL Ready)";
}

/**
 * Login User using Neon PostgreSQL, Supabase, or local fallback
 */
export async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try Neon Serverless PostgreSQL
  if (isNeonConfigured() && sql) {
    try {
      const rows = await sql`
        SELECT * FROM users 
        WHERE LOWER(email) = ${cleanEmail} AND password = ${password}
        LIMIT 1
      `;

      if (!rows || rows.length === 0) {
        throw new Error("Invalid Email or Password. Please check your credentials and try again.");
      }

      const row = rows[0];

      // Check if registrar account is pending approval by Rayyan Ahmed
      if (row.role === 'REGISTRAR' && row.status === 'PENDING_APPROVAL') {
        throw new Error("⏳ Access Pending: Your Sub-Registrar application has been submitted to Chief Admin (Rayyan Ahmed) for verification and background clearance.");
      }

      if (row.status === 'REJECTED') {
        throw new Error("⛔ Access Denied: Your Registrar application was rejected by Chief Admin (Rayyan Ahmed).");
      }

      const user = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status || "ACTIVE",
        cnic: row.cnic || "",
        badgeNumber: row.badge_number || "",
        department: row.department || "",
        walletAddress: row.wallet_address
      };

      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error("Neon PostgreSQL query failed:", err);
      throw err;
    }
  }

  // 2. Local fallback
  const localUsers = getLocalUsers();
  const found = localUsers.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (!found) {
    throw new Error("Invalid Email or Password. Please check credentials.");
  }

  if (found.role === 'REGISTRAR' && found.status === 'PENDING_APPROVAL') {
    throw new Error("⏳ Access Pending: Your Sub-Registrar application has been submitted to Chief Admin (Rayyan Ahmed) for verification.");
  }

  setCurrentUser(found);
  return found;
}

/**
 * Register User in Neon PostgreSQL, Supabase, or local DB
 */
export async function registerUser(userData) {
  const cleanEmail = userData.email.trim().toLowerCase();

  // Registrars require Chief Admin approval!
  const initialStatus = userData.role === 'REGISTRAR' ? 'PENDING_APPROVAL' : 'ACTIVE';

  // Generate a unique cryptographic Ethereum wallet for each user
  let assignedWallet = userData.walletAddress;
  if (!assignedWallet) {
    const randomWallet = ethers.Wallet.createRandom();
    assignedWallet = randomWallet.address;
  }

  // 1. Neon Serverless PostgreSQL Insert
  if (isNeonConfigured() && sql) {
    try {
      const existing = await sql`
        SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1
      `;
      if (existing && existing.length > 0) {
        throw new Error("An account with this Email already exists. Please sign in instead.");
      }

      const rows = await sql`
        INSERT INTO users (name, email, password, role, cnic, badge_number, department, wallet_address, status)
        VALUES (
          ${userData.name}, 
          ${cleanEmail}, 
          ${userData.password}, 
          ${userData.role}, 
          ${userData.cnic || null}, 
          ${userData.badgeNumber || null}, 
          ${userData.department || null}, 
          ${assignedWallet},
          ${initialStatus}
        )
        RETURNING *
      `;

      const row = rows[0];
      const newUser = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        cnic: row.cnic || "",
        badgeNumber: row.badge_number || "",
        department: row.department || "",
        walletAddress: row.wallet_address
      };

      if (initialStatus === 'ACTIVE') {
        setCurrentUser(newUser);
      }
      return newUser;
    } catch (err) {
      console.error("Neon PostgreSQL insert error:", err);
      throw err;
    }
  }

  // 2. Local fallback
  const localUsers = getLocalUsers();
  const existing = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error("An account with this Email already exists.");
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name: userData.name,
    email: cleanEmail,
    password: userData.password,
    role: userData.role,
    status: initialStatus,
    cnic: userData.cnic || "",
    badgeNumber: userData.badgeNumber || "",
    department: userData.department || "",
    walletAddress: assignedWallet,
    registeredAt: new Date().toISOString()
  };

  localUsers.push(newUser);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
  if (initialStatus === 'ACTIVE') {
    setCurrentUser(newUser);
  }
  return newUser;
}

/**
 * Admin: Fetch all users from Neon
 */
export async function fetchAllUsersFromDb() {
  if (isNeonConfigured() && sql) {
    try {
      const rows = await sql`SELECT * FROM users ORDER BY id DESC`;
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status || 'ACTIVE',
        badgeNumber: r.badge_number || '',
        department: r.department || '',
        cnic: r.cnic || '',
        walletAddress: r.wallet_address,
        createdAt: r.created_at
      }));
    } catch (err) {
      console.error(err);
    }
  }
  return getLocalUsers();
}

/**
 * Admin: Approve a pending registrar
 */
export async function approveRegistrarInDb(userId) {
  if (isNeonConfigured() && sql) {
    await sql`UPDATE users SET status = 'ACTIVE' WHERE id = ${userId}`;
    return true;
  }
  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  if (target) {
    target.status = 'ACTIVE';
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }
  return true;
}

/**
 * Admin: Reject a pending registrar
 */
export async function rejectRegistrarInDb(userId) {
  if (isNeonConfigured() && sql) {
    await sql`UPDATE users SET status = 'REJECTED' WHERE id = ${userId}`;
    return true;
  }
  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  if (target) {
    target.status = 'REJECTED';
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }
  return true;
}

/**
 * Admin: Delete / Remove a user (KDA Officer, Buyer, Seller) from Database
 */
export async function deleteUserFromDb(userId, userEmail) {
  if (isNeonConfigured() && sql) {
    try {
      if (userEmail) {
        await sql`DELETE FROM users WHERE email = ${userEmail.trim().toLowerCase()}`;
      } else {
        await sql`DELETE FROM users WHERE id = ${userId}`;
      }
      return true;
    } catch (err) {
      console.error("Neon delete user query failed:", err);
      throw err;
    }
  }

  // Fallback for local storage
  const users = getLocalUsers();
  const updated = users.filter((u) => {
    if (userId && u.id === userId) return false;
    if (userEmail && u.email.toLowerCase() === userEmail.trim().toLowerCase()) return false;
    return true;
  });
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
  return true;
}

/**
 * Admin: Emergency City-Wide Freeze State
 */
export function getEmergencyFreezeState() {
  return localStorage.getItem(EMERGENCY_FREEZE_KEY) === 'true';
}

export function setEmergencyFreezeState(frozen) {
  localStorage.setItem(EMERGENCY_FREEZE_KEY, frozen ? 'true' : 'false');
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
