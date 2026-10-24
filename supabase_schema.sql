-- ==============================================================================
-- 🏛️ ZAMEENCHAIN: SUPABASE POSTGRESQL DATABASE SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create the Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'REGISTRAR')),
    cnic TEXT,
    badge_number TEXT,
    department TEXT,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but allow anonymous access for frontend capstone demo
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.users
    FOR INSERT WITH CHECK (true);

-- 2. Insert Default Initial Seed Accounts
INSERT INTO public.users (name, email, password, role, cnic, badge_number, department, wallet_address)
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
