-- ============================================================================
-- Civion Field Worker Credentials Database Seed
-- Registered Worker Accounts for direct login into the Worker Portal
-- ============================================================================

-- 1. Insert into auth.users (Supabase / Postgres Auth Table)
INSERT INTO auth.users (
    id, 
    instance_id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    role, 
    aud
)
VALUES
(
    '44444444-4444-4444-4444-444444444405', 
    '00000000-0000-0000-0000-000000000000', 
    'deeshukumar975@gmail.com', 
    'deeshu', 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Deeshu Kumar","role":"field_worker","department":"Rapid Road & Civil Maintenance"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated'
),
(
    '44444444-4444-4444-4444-444444444406', 
    '00000000-0000-0000-0000-000000000000', 
    'likeplease8989@gmail.com', 
    'likeplz', 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Like Please Worker","role":"field_worker","department":"Public Infrastructure & Water Works"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated'
)
ON CONFLICT (id) DO UPDATE SET 
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 2. Insert into public.profiles (Application User Profiles)
INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    role, 
    department_id
)
VALUES
(
    '44444444-4444-4444-4444-444444444405', 
    'Deeshu Kumar', 
    'deeshukumar975@gmail.com', 
    '+91-9876543233', 
    'field_worker', 
    '11111111-1111-1111-1111-111111111106' -- Roads & Infrastructure
),
(
    '44444444-4444-4444-4444-444444444406', 
    'Like Please Worker', 
    'likeplease8989@gmail.com', 
    '+91-9876543234', 
    'field_worker', 
    '11111111-1111-1111-1111-111111111102' -- Water & Sanitation
)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
