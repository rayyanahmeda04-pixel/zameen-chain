import { sql, isNeonConfigured } from './neonClient';
import { ethers } from 'ethers';

const CURRENT_USER_KEY = 'zameen_chain_current_user';
const LOCAL_USERS_KEY = 'zameen_chain_users_db_v2';
const WALLET_KEYSTORE_KEY = 'zameen_chain_wallet_keystore';
const EMERGENCY_FREEZE_KEY = 'zameen_chain_emergency_freeze';

// Official verified seed accounts for offline fallback & quick demo access
export const DEFAULT_USERS = [
  {
    id: 'usr_admin_01',
    name: 'Rayyan Ahmed',
    email: 'rayyan.ahmed@sindh.gov.pk',
    password: 'password123',
    role: 'ADMIN',
    status: 'ACTIVE',
    badgeNumber: 'SINDH-CHIEF-ADMIN-01',
    department: 'Ministry of Revenue & Land Reforms, Government of Sindh',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  },
  {
    id: 'usr_reg_01',
    name: 'Engr. Tariq Mansoor',
    email: 'tariq.mansoor@kda.gos.pk',
    password: 'password123',
    role: 'REGISTRAR',
    status: 'ACTIVE',
    badgeNumber: 'KDA-SR-001',
    department: 'KDA Civic Centre - Directorate of Land Management',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  },
  {
    id: 'usr_reg_pending',
    name: 'Khurram Shahzad',
    email: 'khurram.shahzad@kda.gos.pk',
    password: 'password123',
    role: 'REGISTRAR',
    status: 'PENDING_APPROVAL',
    badgeNumber: 'KDA-APPLICANT-892',
    department: 'KDA Surjani Town Sub-Registry Office',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  },
  {
    id: 'usr_sel_01',
    name: 'Aamir Khan',
    email: 'aamir.khan@gmail.com',
    password: 'password123',
    role: 'SELLER',
    status: 'ACTIVE',
    cnic: '42101-9876543-1',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  },
  {
    id: 'usr_sel_02',
    name: 'Bilal Siddiqui',
    email: 'bilal.siddiqui@gmail.com',
    password: 'password123',
    role: 'SELLER',
    status: 'ACTIVE',
    cnic: '42301-7654321-9',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  },
  {
    id: 'usr_buy_01',
    name: 'Hamza Sheikh',
    email: 'hamza.sheikh@gmail.com',
    password: 'password123',
    role: 'BUYER',
    status: 'ACTIVE',
    cnic: '42201-1234567-3',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  }
];

export const QUICK_DEMO_ACCOUNTS = [
  {
    label: 'Chief Admin',
    sublabel: 'Rayyan Ahmed',
    email: 'rayyan.ahmed@sindh.gov.pk',
    password: 'password123',
    role: 'ADMIN'
  },
  {
    label: 'KDA Registrar',
    sublabel: 'Tariq Mansoor',
    email: 'tariq.mansoor@kda.gos.pk',
    password: 'password123',
    role: 'REGISTRAR'
  },
  {
    label: 'Owner (Scheme 33)',
    sublabel: 'Aamir Khan',
    email: 'aamir.khan@gmail.com',
    password: 'password123',
    role: 'SELLER'
  },
  {
    label: 'Owner (Gulshan)',
    sublabel: 'Bilal Siddiqui',
    email: 'bilal.siddiqui@gmail.com',
    password: 'password123',
    role: 'SELLER'
  },
  {
    label: 'Verified Buyer',
    sublabel: 'Hamza Sheikh',
    email: 'hamza.sheikh@gmail.com',
    password: 'password123',
    role: 'BUYER'
  }
];

function sanitizeUser(u) {
  if (!u) return null;
  const { password: _password, ...safeUser } = u;
  return safeUser;
}

export function saveGeneratedWalletKey(address, privateKey) {
  if (!address || !privateKey) return;
  try {
    const raw = localStorage.getItem(WALLET_KEYSTORE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[address.toLowerCase()] = privateKey;
    localStorage.setItem(WALLET_KEYSTORE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage quota issues
  }
}

export function getStoredWalletKey(address) {
  if (!address) return null;
  try {
    const raw = localStorage.getItem(WALLET_KEYSTORE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return store[address.toLowerCase()] || null;
  } catch {
    return null;
  }
}

function getLocalUsers() {
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    return sanitizeUser(JSON.parse(data));
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitizeUser(user)));
  }
}

/**
 * Authenticate User using Neon Serverless PostgreSQL or local fallback
 */
export async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (isNeonConfigured() && sql) {
    const rows = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = ${cleanEmail} AND password = ${password}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      throw new Error('Invalid Email or Password. Please verify your credentials and try again.');
    }

    const row = rows[0];

    if (row.role === 'REGISTRAR' && row.status === 'PENDING_APPROVAL') {
      throw new Error('Accreditation Pending: Your Sub-Registrar application is awaiting clearance from the Chief Administrator.');
    }

    if (row.status === 'REJECTED') {
      throw new Error('Access Denied: Your accreditation request was declined by the Ministry of Revenue.');
    }

    const user = sanitizeUser({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status || 'ACTIVE',
      cnic: row.cnic || '',
      badgeNumber: row.badge_number || '',
      department: row.department || '',
      walletAddress: row.wallet_address
    });

    setCurrentUser(user);
    return user;
  }

  // Local fallback
  const localUsers = getLocalUsers();
  const found = localUsers.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (!found) {
    throw new Error('Invalid Email or Password. Please verify your credentials.');
  }

  if (found.role === 'REGISTRAR' && found.status === 'PENDING_APPROVAL') {
    throw new Error('Accreditation Pending: Your Sub-Registrar application is awaiting Chief Administrator clearance.');
  }

  if (found.status === 'REJECTED') {
    throw new Error('Access Denied: Your accreditation request was declined.');
  }

  const safe = sanitizeUser(found);
  setCurrentUser(safe);
  return safe;
}

/**
 * Register User in Neon PostgreSQL or local DB
 */
export async function registerUser(userData) {
  const cleanEmail = userData.email.trim().toLowerCase();
  const initialStatus = userData.role === 'REGISTRAR' ? 'PENDING_APPROVAL' : 'ACTIVE';

  let assignedWallet = userData.walletAddress;
  if (!assignedWallet) {
    const randomWallet = ethers.Wallet.createRandom();
    assignedWallet = randomWallet.address;
    saveGeneratedWalletKey(randomWallet.address, randomWallet.privateKey);
  }

  if (isNeonConfigured() && sql) {
    const existing = await sql`
      SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1
    `;
    if (existing && existing.length > 0) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const rows = await sql`
      INSERT INTO users (name, email, password, role, cnic, badge_number, department, wallet_address, status)
      VALUES (
        ${userData.name.trim()}, 
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
    const newUser = sanitizeUser({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      cnic: row.cnic || '',
      badgeNumber: row.badge_number || '',
      department: row.department || '',
      walletAddress: row.wallet_address
    });

    if (initialStatus === 'ACTIVE') {
      setCurrentUser(newUser);
    }
    return newUser;
  }

  // Local fallback
  const localUsers = getLocalUsers();
  const existing = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const newRecord = {
    id: `usr_${Date.now()}`,
    name: userData.name.trim(),
    email: cleanEmail,
    password: userData.password,
    role: userData.role,
    status: initialStatus,
    cnic: userData.cnic || '',
    badgeNumber: userData.badgeNumber || '',
    department: userData.department || '',
    walletAddress: assignedWallet,
    createdAt: new Date().toISOString()
  };

  localUsers.push(newRecord);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
  const safeUser = sanitizeUser(newRecord);
  if (initialStatus === 'ACTIVE') {
    setCurrentUser(safeUser);
  }
  return safeUser;
}

/**
 * Admin: Fetch all users
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
      console.error('Database fetch warning:', err);
    }
  }
  return getLocalUsers().map(sanitizeUser);
}

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

export async function deleteUserFromDb(userId, userEmail) {
  if (isNeonConfigured() && sql) {
    if (userEmail) {
      await sql`DELETE FROM users WHERE LOWER(email) = ${userEmail.trim().toLowerCase()}`;
    } else {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    }
    return true;
  }

  const users = getLocalUsers();
  const updated = users.filter((u) => {
    if (userId && u.id === userId) return false;
    if (userEmail && u.email.toLowerCase() === userEmail.trim().toLowerCase()) return false;
    return true;
  });
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
  return true;
}

export function getEmergencyFreezeState() {
  return localStorage.getItem(EMERGENCY_FREEZE_KEY) === 'true';
}

export function setEmergencyFreezeState(frozen) {
  localStorage.setItem(EMERGENCY_FREEZE_KEY, frozen ? 'true' : 'false');
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
