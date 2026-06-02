-- ====================================================================
--                  DREAMSPORTS ARENA DATABASE SCHEMA
-- ====================================================================
-- This SQL script creates the core schema, foreign keys, row-level 
-- security (RLS) rules, and mock seeding data.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Extends the auth.users table for verified athlete identities
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PITCHES (VENUES) TABLE
-- Tracks the complex court dimensions and specifications
CREATE TABLE IF NOT EXISTS public.pitches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Football', 'Basketball', 'Tennis', 'Padel', 'Volleyball')),
    rating NUMERIC(2,1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image TEXT NOT NULL,
    gallery TEXT[] NOT NULL,
    price_per_hour INT NOT NULL, -- Stored in KES
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Fully Booked', 'Maintenance')),
    size TEXT NOT NULL,
    surface_type TEXT NOT NULL,
    indoor BOOLEAN DEFAULT false,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    amenities TEXT[] NOT NULL,
    slots TEXT[] NOT NULL,
    parent_id TEXT REFERENCES public.pitches(id) ON DELETE SET NULL, -- Handles physical split sorter overlaps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RESERVATIONS (BOOKINGS) TABLE
-- Holds the live schedule sessions for courts and coaches
CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY DEFAULT 'res_' || substr(md5(random()::text), 1, 9),
    type TEXT NOT NULL CHECK (type IN ('venue', 'coach')),
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL,
    target_image TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_time TEXT NOT NULL, -- Human-readable time block
    price INT NOT NULL, -- Settle cost in KES
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'PENDING_HOLD', 'CANCELLED')),
    booking_reference TEXT NOT NULL UNIQUE,
    checkout_request_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. WALLETS TABLE
-- Manages cash ledger credits for M-Pesa deposits and refunds
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance_minor INT DEFAULT 750000 NOT NULL, -- Stored in minor units (cents-equivalent) to prevent float overflow
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. WALLET TRANSACTIONS TABLE
-- Holds audit records of all financial events
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT 'tx_' || substr(md5(random()::text), 1, 9),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- Negative for payment, positive for deposit/refund (minor units)
    type TEXT NOT NULL CHECK (type IN ('TOPUP', 'PAYMENT', 'REFUND')),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COACHES TABLE
-- Holds academy coach profiles and specialties
CREATE TABLE IF NOT EXISTS public.coaches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL CHECK (specialty IN ('Tactics', 'Conditioning', 'Shooting', 'Goalkeeping', 'All-Rounder')),
    rating NUMERIC(2,1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image TEXT NOT NULL,
    price_per_hour INT NOT NULL,
    experience TEXT NOT NULL,
    certifications TEXT[] NOT NULL,
    bio TEXT NOT NULL,
    slots TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. REVIEWS TABLE
-- Stores verified customer experiences for venues and coaches
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT 'rev_' || substr(md5(random()::text), 1, 9),
    target_id TEXT NOT NULL, -- Can refer to pitches.id or coaches.id
    user_name TEXT NOT NULL,
    user_image TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. NOTIFICATIONS TABLE
-- System logs for wallet deposits, session confirmation, or betting settling
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT 'n_' || substr(md5(random()::text), 1, 9),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'system')),
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
--                  ROW-LEVEL SECURITY (RLS) RULES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profiles" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profiles" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Reservations Policies
CREATE POLICY "Users can view their own reservations" ON public.reservations 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can reserve slots under their session" ON public.reservations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can adjust their own holds" ON public.reservations 
    FOR UPDATE USING (auth.uid() = user_id);

-- Wallets Policies
CREATE POLICY "Users can view their own wallet balance" ON public.wallets 
    FOR SELECT USING (auth.uid() = user_id);

-- Wallet Transactions Policies
CREATE POLICY "Users can view their own ledger transaction list" ON public.wallet_transactions 
    FOR SELECT USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications log" ON public.notifications 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark notifications read" ON public.notifications 
    FOR UPDATE USING (auth.uid() = user_id);

-- ====================================================================
--                  SEEDING SCRIPTS (MOCK SEED DATA)
-- ====================================================================

-- Seed Pitches
INSERT INTO public.pitches (id, name, category, rating, reviews_count, image, gallery, price_per_hour, status, size, surface_type, indoor, location, description, amenities, slots) VALUES
('v1', 'Riverside Grand Arena', 'Football', 4.9, 142, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80', ARRAY['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'], 3500, 'Available', '11-a-side', 'Premium Pro Grass', false, 'Riverside Drive, Nairobi', 'Experience the pinnacle of football matches at Riverside Grand. Designed for full 11-a-side matches with championship-grade synthetic turf, high-intensity floodlighting, and electronic scoreboards.', ARRAY['Floodlights', 'Locker Rooms', 'Free Parking', 'Showered Toilets', 'Juice Bar'], ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']),
('v2', 'Kilimani Indoor Cage', 'Football', 4.7, 88, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80', ARRAY['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80'], 2200, 'Available', '5-a-side', 'Shock-absorbing synthetic', true, 'Chania Avenue, Kilimani', 'Rain or shine, lock your game in Kilimani''s best indoor cage. Perfect for fast-paced 5-a-side games under bright LED rigs and shock-absorbing rubber padding.', ARRAY['Indoor AC', 'Locker Rooms', 'Free Wi-Fi', 'Water Dispenser'], ARRAY['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']),
('v3', 'Apex Padel Club', 'Padel', 4.8, 64, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80', ARRAY['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'], 2800, 'Available', 'Double Court', 'Panoramic Glass Padel Turf', true, 'Westlands Mall Rooftop', 'Play padel on Nairobi''s premium rooftop court. Features panoramic view glass panels, vibrant neon lighting, and high-bounce blue turf.', ARRAY['Panoramic Glass', 'Pro Shop', 'Cafe Bar', 'Equipment Rental', 'Showers'], ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']);

-- Seed Coaches
INSERT INTO public.coaches (id, name, specialty, rating, reviews_count, image, price_per_hour, experience, certifications, bio, slots) VALUES
('c1', 'Coach David Mwangi', 'Tactics', 4.9, 47, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 1800, '12 Years', ARRAY['UEFA A License', 'CAF Elite A Coach'], 'Ex-Professional midfield general specializing in off-the-ball tactical positioning, passing geometry, and game reading.', ARRAY['09:00', '11:00', '14:00', '16:00']),
('c2', 'Coach Elena Rostova', 'Conditioning', 4.8, 31, 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80', 1500, '8 Years', ARRAY['NCSF Certified Strength Trainer', 'EXOS Speed Specialist'], 'Agility matrices, sprint power, acceleration mechanics, and sports conditioning specialist.', ARRAY['08:00', '10:00', '15:00', '17:00']);

-- Seed Reviews
INSERT INTO public.reviews (target_id, user_name, user_image, rating, comment) VALUES
('v1', 'Alex Kamau', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80', 5, 'The lighting system at Riverside is absolutely insane! Felt like a real Champions League night. Worth every single shilling.'),
('c1', 'Brian Ochieng', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', 5, 'Coach David has completely revolutionized how I read space on the pitch. Outstanding instruction!');
