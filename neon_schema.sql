-- ==============================================================================
-- 🐘 ZAMEENCHAIN: NEON SERVERLESS POSTGRESQL DATABASE SCHEMA
-- Run this in your Neon Console: (neon.tech -> Project -> SQL Editor -> Run)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'REGISTRAR', 'SELLER', 'BUYER')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_APPROVAL', 'REJECTED')),
    cnic VARCHAR(50),
    badge_number VARCHAR(100),
    department VARCHAR(255),
    wallet_address VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
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
