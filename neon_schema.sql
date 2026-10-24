-- ==============================================================================
-- 🐘 ZAMEENCHAIN: NEON SERVERLESS POSTGRESQL DATABASE SCHEMA
-- Run this in your Neon Console: (neon.tech -> Project -> SQL Editor -> Run)
-- ==============================================================================

-- 1. Create the Users Table in Neon PostgreSQL
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

-- 2. Insert Default Verified Seed Accounts
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
