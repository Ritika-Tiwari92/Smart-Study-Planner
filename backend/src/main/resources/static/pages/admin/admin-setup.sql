-- ══════════════════════════════════════════════════════════
-- EduMind AI — Admin Account Setup
-- ══════════════════════════════════════════════════════════
-- 
-- Step 1: Pehle apna Spring Boot server start karo.
--         ddl-auto=update se 'role' column automatically
--         users table mein add ho jayega.
--
-- Step 2: Niche diye SQL commands apne MySQL Workbench ya
--         phpMyAdmin mein run karo.
--
-- Step 3: Password yahan BCrypt encoded hai.
--         Default password: Admin@123
--         (Baad mein admin settings se change karna)
-- ══════════════════════════════════════════════════════════


-- ──────────────────────────────────────────
-- STEP 1: Check karo role column add hua ya nahi
-- ──────────────────────────────────────────
DESCRIBE users;
-- Agar 'role' column nahi dikh raha toh manually add karo:
-- ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'STUDENT';


-- ──────────────────────────────────────────
-- STEP 2: Admin account insert karo
-- ──────────────────────────────────────────
-- 
-- Password BCrypt hash of: Admin@123
-- Isko change karna ho toh naye password ka BCrypt hash generate karo:
-- https://bcrypt-generator.com (10 rounds)
--
INSERT INTO users (
    full_name,
    email,
    password,
    course,
    college,
    role,
    two_factor_enabled,
    preferred_study_time,
    daily_study_goal,
    task_reminders_enabled,
    revision_alerts_enabled,
    test_notifications_enabled,
    assistant_suggestions_enabled,
    failed_login_attempts,
    created_at
) VALUES (
    'EduMind Admin',
    'admin@edumind.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq',
    'Administration',
    'EduMind AI System',
    'ADMIN',
    false,
    'Morning',
    '8 Hours',
    false,
    false,
    false,
    false,
    0,
    NOW()
);


-- ──────────────────────────────────────────
-- STEP 3: Verify — admin account ban gaya?
-- ──────────────────────────────────────────
SELECT id, full_name, email, role, created_at 
FROM users 
WHERE role = 'ADMIN';


-- ──────────────────────────────────────────
-- EXTRA: Existing user ko admin banana ho toh
-- ──────────────────────────────────────────
-- UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';


-- ──────────────────────────────────────────
-- EXTRA: Admin ko wapas student banana ho toh
-- ──────────────────────────────────────────
-- UPDATE users SET role = 'STUDENT' WHERE email = 'admin@edumind.com';


-- ══════════════════════════════════════════════════════════
-- Default Admin Credentials:
-- Email:    admin@edumind.com
-- Password: Admin@123
-- ══════════════════════════════════════════════════════════