import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pty from 'node-pty';
import os from 'os';
import { execFile } from 'child_process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads', 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// DATABASE SCHEMA UPGRADE (non-destructive)
// ============================================================
const upgradeDatabaseSchema = async () => {
  try {
    console.log("Checking and upgrading database schema...");

    // Existing columns
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT ARRAY[]::TEXT[];`);
    await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;`);

    // Existing tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        link VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        target_name VARCHAR(255) NOT NULL,
        target_link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS target_link VARCHAR(255);`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        admin_name VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── NEW: Tags ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id    SERIAL PRIMARY KEY,
        name  VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(20) DEFAULT '#6366f1'
      );
    `);

    // ── NEW: Skills (central axis) ─────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id       SERIAL PRIMARY KEY,
        name     VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100),
        icon     VARCHAR(50)
      );
    `);

    // ── NEW: Course skills ─────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_skills (
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        skill_id  INTEGER REFERENCES skills(id)  ON DELETE CASCADE,
        weight    NUMERIC(3,2) DEFAULT 1.0,
        PRIMARY KEY (course_id, skill_id)
      );
    `);

    // ── NEW: Student knowledge (linked to skills) ──────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_knowledge (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER REFERENCES users(id)   ON DELETE CASCADE,
        skill_id       INTEGER REFERENCES skills(id)  ON DELETE CASCADE,
        score          NUMERIC(4,3) DEFAULT 0.0,
        success_count  INTEGER DEFAULT 0,
        error_count    INTEGER DEFAULT 0,
        current_level  VARCHAR(20) DEFAULT 'easy',
        last_activity  TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, skill_id)
      );
    `);

    // ── NEW: Code executions log ───────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS code_executions (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language    VARCHAR(50),
        version     VARCHAR(20),
        code        TEXT,
        stdout      TEXT,
        stderr      TEXT,
        exit_code   INTEGER,
        time_ms     INTEGER,
        context     VARCHAR(50),
        context_id  VARCHAR(100),
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── NEW: AI Chats ──────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Новый диалог',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES ai_chats(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── NEW: Projects (unified ide_projects + projects) ────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        language      VARCHAR(50),
        code          TEXT,
        type          VARCHAR(50) NOT NULL DEFAULT 'ide',
        source_id     VARCHAR(100),
        tech_tags     TEXT[],
        thumbnail_url TEXT,
        is_public     BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── NEW: Challenges ────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id             SERIAL PRIMARY KEY,
        title          VARCHAR(255) NOT NULL,
        slug           VARCHAR(255) UNIQUE,
        difficulty     VARCHAR(20) DEFAULT 'easy',
        description    TEXT,
        examples       JSONB,
        test_cases     JSONB,
        time_limit_ms  INTEGER DEFAULT 5000,
        memory_limit   INTEGER DEFAULT 256,
        created_by     INTEGER REFERENCES users(id),
        is_published   BOOLEAN DEFAULT FALSE,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_tags (
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        tag_id       INTEGER REFERENCES tags(id)       ON DELETE CASCADE,
        PRIMARY KEY (challenge_id, tag_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_skills (
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        skill_id     INTEGER REFERENCES skills(id)     ON DELETE CASCADE,
        PRIMARY KEY (challenge_id, skill_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_solutions (
        id            SERIAL PRIMARY KEY,
        challenge_id  INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        language      VARCHAR(50),
        solution_code TEXT NOT NULL,
        explanation   TEXT,
        UNIQUE (challenge_id, language)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_attempts (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id)       ON DELETE CASCADE,
        challenge_id  INTEGER REFERENCES challenges(id)  ON DELETE CASCADE,
        code          TEXT,
        language      VARCHAR(50),
        status        VARCHAR(30),
        stdout        TEXT,
        stderr        TEXT,
        runtime_ms    INTEGER,
        attempt_num   INTEGER DEFAULT 1,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── NEW: Exams (standalone entity) ────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id              SERIAL PRIMARY KEY,
        title           VARCHAR(255) NOT NULL,
        description     TEXT,
        time_limit_min  INTEGER DEFAULT 60,
        passing_score   NUMERIC(5,2) DEFAULT 70.0,
        max_attempts    INTEGER DEFAULT 3,
        created_by      INTEGER REFERENCES users(id),
        is_published    BOOLEAN DEFAULT FALSE,
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id          SERIAL PRIMARY KEY,
        exam_id     INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        type        VARCHAR(20) DEFAULT 'quiz',
        content     JSONB NOT NULL,
        points      NUMERIC(5,2) DEFAULT 1.0,
        order_index INTEGER DEFAULT 0,
        skill_id    INTEGER REFERENCES skills(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id)  ON DELETE CASCADE,
        exam_id     INTEGER REFERENCES exams(id)  ON DELETE CASCADE,
        answers     JSONB,
        score       NUMERIC(5,2),
        passed      BOOLEAN,
        started_at  TIMESTAMP,
        finished_at TIMESTAMP
      );
    `);

    // ── NEW: Course versioning ─────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_versions (
        id         SERIAL PRIMARY KEY,
        course_id  INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        version    VARCHAR(20) NOT NULL,
        changelog  TEXT,
        is_current BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_tags (
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        tag_id    INTEGER REFERENCES tags(id)    ON DELETE CASCADE,
        PRIMARY KEY (course_id, tag_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_prerequisites (
        course_id           INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        required_course_id  INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        PRIMARY KEY (course_id, required_course_id)
      );
    `);

    // ── NEW: Modules & lesson blocks ──────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id           SERIAL PRIMARY KEY,
        course_id    INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title        VARCHAR(255) NOT NULL,
        description  TEXT,
        order_index  INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        exam_id      INTEGER REFERENCES exams(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_blocks (
        id          SERIAL PRIMARY KEY,
        lesson_id   VARCHAR(100) REFERENCES lessons(id) ON DELETE CASCADE,
        type        VARCHAR(30) DEFAULT 'theory',
        order_index INTEGER DEFAULT 0,
        content     JSONB,
        skill_id    INTEGER REFERENCES skills(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS text_submissions (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER REFERENCES users(id)          ON DELETE CASCADE,
        block_id         INTEGER REFERENCES lesson_blocks(id)  ON DELETE CASCADE,
        content          TEXT,
        ai_feedback      TEXT,
        ai_score         NUMERIC(4,1),
        teacher_feedback TEXT,
        teacher_score    NUMERIC(4,1),
        status           VARCHAR(20) DEFAULT 'pending',
        created_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id)         ON DELETE CASCADE,
        block_id    INTEGER REFERENCES lesson_blocks(id) ON DELETE CASCADE,
        answers     JSONB,
        score       NUMERIC(5,2),
        passed      BOOLEAN,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── NEW: Learning Paths (normalized) ──────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id               SERIAL PRIMARY KEY,
        title            VARCHAR(255) NOT NULL,
        slug             VARCHAR(255) UNIQUE,
        description      TEXT,
        icon             VARCHAR(50),
        estimated_weeks  INTEGER,
        is_published     BOOLEAN DEFAULT TRUE,
        created_by       INTEGER REFERENCES users(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_path_courses (
        id          SERIAL PRIMARY KEY,
        path_id     INTEGER REFERENCES learning_paths(id) ON DELETE CASCADE,
        course_id   INTEGER REFERENCES courses(id)        ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_required BOOLEAN DEFAULT TRUE,
        UNIQUE (path_id, course_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_path_skills (
        path_id  INTEGER REFERENCES learning_paths(id) ON DELETE CASCADE,
        skill_id INTEGER REFERENCES skills(id)         ON DELETE CASCADE,
        PRIMARY KEY (path_id, skill_id)
      );
    `);

    // ── NEW: AI Study Plans ───────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_study_plans (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan         JSONB NOT NULL,
        generated_at TIMESTAMP DEFAULT NOW(),
        is_active    BOOLEAN DEFAULT TRUE
      );
    `);

    // ── NEW: Certificates ─────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id                SERIAL PRIMARY KEY,
        user_id           INTEGER REFERENCES users(id)   ON DELETE CASCADE,
        course_id         INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        exam_id           INTEGER REFERENCES exams(id)   ON DELETE SET NULL,
        certificate_code  VARCHAR(64) UNIQUE NOT NULL,
        issued_at         TIMESTAMP DEFAULT NOW(),
        expires_at        TIMESTAMP,
        pdf_url           TEXT
      );
    `);

    // ── NEW: Seed default skills ───────────────────────────
    await pool.query(`
      INSERT INTO skills (name, category, icon) VALUES
        ('Variables',    'Basics',      '📦'),
        ('Loops',        'Basics',      '🔄'),
        ('Functions',    'Basics',      '⚡'),
        ('Arrays',       'Data Struct', '📋'),
        ('Strings',      'Data Struct', '🔤'),
        ('OOP',          'Advanced',    '🧩'),
        ('Recursion',    'Advanced',    '🌀'),
        ('SQL',          'Database',    '🗄️'),
        ('LINQ',         'C#',          '🔍'),
        ('Algorithms',   'CS',          '🧠'),
        ('HTML/CSS',     'Web',         '🎨'),
        ('DOM',          'Web',         '🌐'),
        ('Async/Await',  'JavaScript',  '⏳'),
        ('React',        'JavaScript',  '⚛️'),
        ('Error Handling','Advanced',   '🛡️')
      ON CONFLICT (name) DO NOTHING;
    `);

    // ── NEW: Seed default tags ────────────────────────────
    await pool.query(`
      INSERT INTO tags (name, color) VALUES
        ('Python',      '#3776ab'),
        ('JavaScript',  '#f7df1e'),
        ('C#',          '#9b59b6'),
        ('Java',        '#e74c3c'),
        ('SQL',         '#2ecc71'),
        ('Algorithms',  '#e67e22'),
        ('Data Structures', '#1abc9c'),
        ('OOP',         '#8e44ad'),
        ('Web Dev',     '#61dafb'),
        ('Beginner',    '#10b981'),
        ('Medium',      '#f59e0b'),
        ('Hard',        '#ef4444')
      ON CONFLICT (name) DO NOTHING;
    `);

    await pool.query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS block_progress (
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        block_id   INTEGER REFERENCES lesson_blocks(id) ON DELETE CASCADE,
        completed  BOOLEAN DEFAULT FALSE,
        score      NUMERIC(5,2),
        saved_code TEXT,
        completed_at TIMESTAMP,
        PRIMARY KEY (user_id, block_id)
      );
    `);

    console.log("Database schema upgrade completed successfully.");
  } catch (err) {
    console.error("Database schema upgrade failed:", err.message);
  }
};

upgradeDatabaseSchema();

// ============================================================
// MIDDLEWARE
// ============================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required" });
  jwt.verify(token, process.env.JWT_SECRET || 'codeai_secret_jwt_key_2026', (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Teachers only." });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// ============================================================
// AUTH
// ============================================================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Please fill in all fields" });
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExists.rowCount > 0) return res.status(400).json({ error: "An account with this email already exists" });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const userRole = 'user';
    const newUser = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding)
      VALUES ($1, $2, $3, $4, 0, 1, ARRAY[]::TEXT[], 'Earth', 'Learning to code!', $5, 0, FALSE)
      RETURNING id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, cover_url
    `, [name, email.toLowerCase(), passwordHash, userRole, joinedDate]);
    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'codeai_secret_jwt_key_2026', { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Please fill in all fields" });
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rowCount === 0) return res.status(400).json({ error: "No account found with this email" });
    const user = userResult.rows[0];
    if (user.is_banned) return res.status(403).json({ error: "Ваш аккаунт заблокирован администратором." });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password" });
    delete user.password_hash;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'codeai_secret_jwt_key_2026', { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, cover_url FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rowCount === 0) return res.status(404).json({ error: "User not found" });
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching user" });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { name, location, bio } = req.body;
  try {
    const updated = await pool.query(`
      UPDATE users SET name = COALESCE($1, name), location = COALESCE($2, location), bio = COALESCE($3, bio)
      WHERE id = $4
      RETURNING id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, cover_url
    `, [name, location, bio, req.user.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating profile" });
  }
});

app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Please enter current and new passwords" });
  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rowCount === 0) return res.status(404).json({ error: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error changing password" });
  }
});

app.post('/api/auth/study-time', authenticateToken, async (req, res) => {
  const { seconds } = req.body;
  if (typeof seconds !== 'number' || seconds <= 0) return res.status(400).json({ error: "Valid seconds number is required" });
  try {
    const result = await pool.query(`
      UPDATE users SET study_time_seconds = study_time_seconds + $1 WHERE id = $2 RETURNING study_time_seconds
    `, [Math.round(seconds), req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });
    res.json({ studyTimeSeconds: result.rows[0].study_time_seconds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating study time" });
  }
});

app.post('/api/auth/complete-onboarding', authenticateToken, async (req, res) => {
  const { track } = req.body;
  try {
    const userUpdate = await pool.query(`
      UPDATE users SET has_completed_onboarding = TRUE WHERE id = $1
      RETURNING id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, cover_url
    `, [req.user.id]);
    if (userUpdate.rowCount === 0) return res.status(404).json({ error: "User not found" });
    const updatedUser = userUpdate.rows[0];
    if (track) {
      const courseRes = await pool.query('SELECT id FROM courses WHERE category = $1 ORDER BY id ASC LIMIT 1', [track]);
      if (courseRes.rowCount > 0) {
        const courseId = courseRes.rows[0].id;
        const lessonRes = await pool.query('SELECT id FROM lessons WHERE course_id = $1 ORDER BY subtitle ASC LIMIT 1', [courseId]);
        const activeLessonId = lessonRes.rowCount > 0 ? lessonRes.rows[0].id : null;
        await pool.query(`
          INSERT INTO progress (user_id, course_id, completed_lessons, active_lesson_id)
          VALUES ($1, $2, ARRAY[]::TEXT[], $3)
          ON CONFLICT (user_id, course_id) DO NOTHING
        `, [req.user.id, courseId, activeLessonId]);
      }
    }
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error completing onboarding" });
  }
});

// ============================================================
// AVATAR & COVER UPLOAD
// ============================================================
app.post('/api/auth/avatar', authenticateToken, async (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) return res.status(400).json({ error: "No image data supplied" });
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return res.status(400).json({ error: "Invalid base64 image data" });
    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    if (imageBuffer.length > 2 * 1024 * 1024) return res.status(400).json({ error: "Image size must be less than 2MB" });
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ error: "Allowed formats: JPG, PNG, WEBP" });
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `user_${req.user.id}.${ext}`;
    fs.writeFileSync(path.join(__dirname, 'uploads', 'avatars', fileName), imageBuffer);
    const relativeUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [relativeUrl, req.user.id]);
    res.json({ avatarUrl: relativeUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error processing image upload" });
  }
});

app.delete('/api/auth/avatar', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount > 0 && result.rows[0].avatar_url) {
      const localFilePath = path.join(__dirname, result.rows[0].avatar_url.split('?')[0]);
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    }
    await pool.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error removing avatar" });
  }
});

app.post('/api/auth/cover', authenticateToken, async (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) return res.status(400).json({ error: "No image data supplied" });
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return res.status(400).json({ error: "Invalid base64 image data" });
    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    if (imageBuffer.length > 4 * 1024 * 1024) return res.status(400).json({ error: "Cover image size must be less than 4MB" });
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ error: "Allowed formats: JPG, PNG, WEBP" });
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `user_cover_${req.user.id}.${ext}`;
    fs.writeFileSync(path.join(__dirname, 'uploads', 'avatars', fileName), imageBuffer);
    const relativeUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;
    await pool.query('UPDATE users SET cover_url = $1 WHERE id = $2', [relativeUrl, req.user.id]);
    res.json({ coverUrl: relativeUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error processing cover upload" });
  }
});

app.delete('/api/auth/cover', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT cover_url FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount > 0 && result.rows[0].cover_url) {
      const localFilePath = path.join(__dirname, result.rows[0].cover_url.split('?')[0]);
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    }
    await pool.query('UPDATE users SET cover_url = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error removing cover photo" });
  }
});

// Generic Image Upload (e.g. for course covers)
app.post('/api/upload-image', authenticateToken, async (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) return res.status(400).json({ error: "No image data supplied" });
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return res.status(400).json({ error: "Invalid base64 image data" });
    
    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    if (imageBuffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: "Image size must be less than 5MB" });
    
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ error: "Allowed formats: JPG, PNG, WEBP" });
    
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    
    const imagesDir = path.join(__dirname, 'uploads', 'images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
    
    const fileName = `img_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
    fs.writeFileSync(path.join(imagesDir, fileName), imageBuffer);
    
    const relativeUrl = `/uploads/images/${fileName}`;
    res.json({ imageUrl: relativeUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error processing image upload" });
  }
});

// ============================================================
// USERS & PROFILES
// ============================================================
app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;
    const userRes = await pool.query(`
      SELECT id, name, role, location, bio, joined_date, avatar_url, cover_url, xp, achievements
      FROM users WHERE id = $1
    `, [userId]);

    if (userRes.rowCount === 0) return res.status(404).json({ error: "User not found" });
    const userProfile = userRes.rows[0];

    // If teacher, calculate created courses, students, and tasks
    if (userProfile.role === 'teacher' || userProfile.role === 'admin') {
      const statsRes = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM courses WHERE created_by = $1) as created_courses,
          (SELECT COUNT(DISTINCT user_id) FROM progress WHERE course_id IN (SELECT id FROM courses WHERE created_by = $1)) as total_students,
          (SELECT COUNT(*) FROM challenges WHERE created_by = $1) as created_challenges
      `, [userId]);
      userProfile.teacherStats = statsRes.rows[0];
    }

    // Always fetch student progress stats for everyone
    const progressRes = await pool.query(`
      SELECT 
        p.course_id, 
        cardinality(p.completed_lessons) as completed_count,
        (SELECT COUNT(*) FROM lessons WHERE course_id = p.course_id) as total_count
      FROM progress p
      WHERE p.user_id = $1
    `, [userId]);
    
    let completedLessonsCount = 0;
    let completedCoursesCount = 0;
    
    progressRes.rows.forEach(row => {
      const completed = parseInt(row.completed_count) || 0;
      const total = parseInt(row.total_count) || 0;
      completedLessonsCount += completed;
      if (total > 0 && completed === total) {
        completedCoursesCount++;
      }
    });

    userProfile.studentStats = {
      completedCoursesCount,
      completedLessonsCount
    };

    // Fetch top 5 recent activities
    const activitiesRes = await pool.query(`
      SELECT action_type, target_name, target_link, created_at 
      FROM activity_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);
    userProfile.activities = activitiesRes.rows;

    res.json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching user profile" });
  }
});

// ============================================================
// COURSES & LESSONS
// ============================================================
app.get('/api/courses', async (req, res) => {
  try {
    const coursesRes = await pool.query(`
      SELECT 
        c.*,
        u.name as author_name,
        (SELECT COUNT(DISTINCT user_id) FROM progress p WHERE p.course_id = c.id) as computed_students,
        (SELECT ROUND(AVG(rating), 2) FROM course_ratings r WHERE r.course_id = c.id) as computed_rating
      FROM courses c 
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY id ASC
    `);
    const lessonsRes = await pool.query('SELECT * FROM lessons ORDER BY subtitle ASC');
    const coursesWithLessons = coursesRes.rows.map(course => ({
      ...course,
      students: course.computed_students || "0",
      rating: parseFloat(course.computed_rating) || 0.0,
      lessons: lessonsRes.rows
        .filter(l => l.course_id === course.id)
        .map(l => ({
          id: l.id, title: l.title, subtitle: l.subtitle,
          estimatedTime: l.estimated_time, instructions: l.instructions,
          initialCode: l.initial_code, language: l.language,
          testCases: l.test_cases, solutionCode: l.solution_code
        }))
    }));
    res.json(coursesWithLessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching courses" });
  }
});

app.post('/api/courses/:id/rate', authenticateToken, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.id;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    await pool.query(`
      INSERT INTO course_ratings (course_id, user_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (course_id, user_id) 
      DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
    `, [courseId, userId, rating]);

    // Recalculate average rating
    const avgRes = await pool.query(`
      SELECT ROUND(AVG(rating), 2) as computed_rating
      FROM course_ratings
      WHERE course_id = $1
    `, [courseId]);

    res.json({ success: true, rating: parseFloat(avgRes.rows[0].computed_rating) || 0.0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error submitting rating" });
  }
});

app.post('/api/courses', authenticateToken, requireTeacher, async (req, res) => {
  const { title, level, category, color, description, image_url } = req.body;
  if (!title || !category || !description) return res.status(400).json({ error: "Please fill in title, category, and description" });
  try {
    const result = await pool.query(`
      INSERT INTO courses (title, level, category, color, description, image_url, students, rating, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, '0', 5.0, $7) RETURNING *
    `, [title, level || 'Beginner', category, color || '#6366f1', description, image_url || null, req.user.id]);
    await pool.query(`INSERT INTO activity_logs (user_id, action_type, target_name, target_link) VALUES ($1, 'course_created', $2, $3)`, [req.user.id, title, `/courses/${result.rows[0].id}`]);
    res.status(201).json({ ...result.rows[0], lessons: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating course" });
  }
});

app.post('/api/courses/:courseId/lessons', authenticateToken, requireTeacher, async (req, res) => {
  const { courseId } = req.params;
  const { id, title, subtitle, estimatedTime, instructions, initialCode, language, testCases, solutionCode } = req.body;
  if (!id || !title || !subtitle || !estimatedTime || !language || !testCases || instructions === undefined || initialCode === undefined || solutionCode === undefined) {
    return res.status(400).json({ error: "Please fill in all lesson fields" });
  }
  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rowCount === 0) return res.status(404).json({ error: "Course not found" });
    const lessonExists = await pool.query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (lessonExists.rowCount > 0) return res.status(400).json({ error: "A lesson with this ID already exists" });
    const result = await pool.query(`
      INSERT INTO lessons (id, course_id, title, subtitle, estimated_time, instructions, initial_code, language, test_cases, solution_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [id, courseId, title, subtitle, estimatedTime, instructions, initialCode, language, JSON.stringify(testCases), solutionCode]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating lesson" });
  }
});

app.delete('/api/courses/:id', authenticateToken, requireTeacher, async (req, res) => {
  const { id } = req.params;
  try {
    const courseRes = await pool.query('SELECT title FROM courses WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    if (courseRes.rowCount === 0) return res.status(404).json({ error: "Course not found or unauthorized" });
    await pool.query('DELETE FROM courses WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    res.json({ success: true, message: `Course "${courseRes.rows[0].title}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting course" });
  }
});

app.delete('/api/courses/:courseId/lessons/:lessonId', authenticateToken, requireTeacher, async (req, res) => {
  const { courseId, lessonId } = req.params;
  try {
    const lessonRes = await pool.query('SELECT title FROM lessons WHERE id = $1 AND course_id = $2', [lessonId, courseId]);
    if (lessonRes.rowCount === 0) return res.status(404).json({ error: "Lesson not found in this course" });
    await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);
    res.json({ success: true, message: `Lesson "${lessonRes.rows[0].title}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting lesson" });
  }
});

app.put('/api/courses/:id', authenticateToken, requireTeacher, async (req, res) => {
  const { id } = req.params;
  const { title, level, category, color, description, image_url, is_published } = req.body;
  try {
    const result = await pool.query(`
      UPDATE courses SET title=COALESCE($1,title), level=COALESCE($2,level),
        category=COALESCE($3,category), color=COALESCE($4,color), description=COALESCE($5,description),
        image_url=COALESCE($6,image_url), is_published=COALESCE($7,is_published)
      WHERE id=$8 AND created_by=$9 RETURNING *
    `, [title, level, category, color, description, image_url, is_published, id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Course not found or unauthorized" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating course" });
  }
});

app.put('/api/courses/:courseId/lessons/:lessonId', authenticateToken, requireTeacher, async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { title, subtitle, estimated_time, language, order_index } = req.body;
  try {
    const result = await pool.query(`
      UPDATE lessons SET title=COALESCE($1,title), subtitle=COALESCE($2,subtitle),
        estimated_time=COALESCE($3,estimated_time), language=COALESCE($4,language),
        order_index=COALESCE($5,order_index)
      WHERE id=$6 AND course_id=$7 RETURNING *
    `, [title, subtitle, estimated_time, language, order_index, lessonId, courseId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Lesson not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating lesson" });
  }
});

app.post('/api/courses/:courseId/lessons/reorder', authenticateToken, requireTeacher, async (req, res) => {
  const { courseId } = req.params;
  const { lessons } = req.body;
  if (!Array.isArray(lessons)) return res.status(400).json({ error: "lessons array required" });
  try {
    for (const l of lessons) {
      await pool.query('UPDATE lessons SET order_index=$1 WHERE id=$2 AND course_id=$3', [l.order_index, l.id, courseId]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error reordering lessons" });
  }
});

app.get('/api/lessons/:lessonId/blocks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lesson_blocks WHERE lesson_id=$1 ORDER BY order_index ASC', [req.params.lessonId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching blocks" });
  }
});

app.post('/api/lessons/:lessonId/blocks', authenticateToken, requireTeacher, async (req, res) => {
  const { type, order_index, content, skill_id } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO lesson_blocks (lesson_id, type, order_index, content, skill_id)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.params.lessonId, type || 'theory', order_index || 0, content, skill_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating block" });
  }
});

app.put('/api/lessons/:lessonId/blocks/:blockId', authenticateToken, requireTeacher, async (req, res) => {
  const { type, order_index, content, skill_id } = req.body;
  try {
    const result = await pool.query(`
      UPDATE lesson_blocks SET type=COALESCE($1,type), order_index=COALESCE($2,order_index),
        content=COALESCE($3,content), skill_id=COALESCE($4,skill_id)
      WHERE id=$5 AND lesson_id=$6 RETURNING *
    `, [type, order_index, content, skill_id, req.params.blockId, req.params.lessonId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Block not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating block" });
  }
});

app.delete('/api/lessons/:lessonId/blocks/:blockId', authenticateToken, requireTeacher, async (req, res) => {
  try {
    await pool.query('DELETE FROM lesson_blocks WHERE id=$1 AND lesson_id=$2', [req.params.blockId, req.params.lessonId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting block" });
  }
});

app.post('/api/lessons/:lessonId/blocks/reorder', authenticateToken, requireTeacher, async (req, res) => {
  const { blocks } = req.body;
  try {
    for (const b of blocks) {
      await pool.query('UPDATE lesson_blocks SET order_index=$1 WHERE id=$2 AND lesson_id=$3', [b.order_index, b.id, req.params.lessonId]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error reordering blocks" });
  }
});

app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const courseRes = await pool.query('SELECT id FROM courses WHERE id=$1', [req.params.id]);
    if (courseRes.rowCount === 0) return res.status(404).json({ error: "Course not found" });
    
    await pool.query(`
      INSERT INTO progress (user_id, course_id, completed_lessons)
      VALUES ($1, $2, ARRAY[]::TEXT[])
      ON CONFLICT DO NOTHING
    `, [req.user.id, req.params.id]);
    
    await pool.query(`
      UPDATE courses SET students = (students::int + 1)::text WHERE id = $1
    `, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error enrolling" });
  }
});

app.delete('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM progress WHERE user_id=$1 AND course_id=$2', [req.user.id, req.params.id]);
    await pool.query(`
      UPDATE courses SET students = GREATEST((students::int - 1), 0)::text WHERE id = $1
    `, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error unenrolling" });
  }
});

app.post('/api/blocks/:blockId/complete', authenticateToken, async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO block_progress (user_id, block_id, completed, completed_at)
      VALUES ($1, $2, TRUE, NOW())
      ON CONFLICT (user_id, block_id) DO UPDATE SET completed = TRUE, completed_at = NOW()
    `, [req.user.id, req.params.blockId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/blocks/:blockId/quiz-submit', authenticateToken, async (req, res) => {
  const { answers, score, passed } = req.body;
  try {
    await pool.query(`
      INSERT INTO quiz_attempts (user_id, block_id, answers, score, passed)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.id, req.params.blockId, JSON.stringify(answers), score, passed]);
    await pool.query(`
      INSERT INTO block_progress (user_id, block_id, completed, score, completed_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, block_id) DO UPDATE SET completed = EXCLUDED.completed, score = EXCLUDED.score, completed_at = NOW()
    `, [req.user.id, req.params.blockId, passed, score]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/blocks/:blockId/code-submit', authenticateToken, async (req, res) => {
  const { saved_code, passed } = req.body;
  try {
    await pool.query(`
      INSERT INTO block_progress (user_id, block_id, completed, saved_code, completed_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, block_id) DO UPDATE SET completed = EXCLUDED.completed, saved_code = EXCLUDED.saved_code, completed_at = NOW()
    `, [req.user.id, req.params.blockId, passed, saved_code]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/lessons/:lessonId/progress', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bp.* FROM block_progress bp
      JOIN lesson_blocks lb ON lb.id = bp.block_id
      WHERE bp.user_id = $1 AND lb.lesson_id = $2
    `, [req.user.id, req.params.lessonId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching block progress" });
  }
});

// ============================================================
// PROGRESS
// ============================================================
app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const progressRes = await pool.query('SELECT * FROM progress WHERE user_id = $1', [req.user.id]);
    const codeRes = await pool.query('SELECT * FROM saved_code WHERE user_id = $1', [req.user.id]);
    const progressMap = {};
    progressRes.rows.forEach(p => {
      progressMap[p.course_id] = { completedLessons: p.completed_lessons || [], activeLessonId: p.active_lesson_id, code: {} };
    });
    codeRes.rows.forEach(c => {
      if (!progressMap[c.course_id]) progressMap[c.course_id] = { completedLessons: [], activeLessonId: '', code: {} };
      progressMap[c.course_id].code[c.lesson_id] = c.code;
    });
    res.json(progressMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching progress" });
  }
});

app.get('/api/progress/stats', authenticateToken, async (req, res) => {
  try {
    const solvedRes = await pool.query(
      "SELECT COUNT(DISTINCT challenge_id) as count FROM challenge_attempts WHERE user_id = $1 AND status = 'accepted'",
      [req.user.id]
    );
    res.json({ challengesSolved: parseInt(solvedRes.rows[0].count) || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching stats" });
  }
});
app.get('/api/progress/heatmap', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM activity_logs
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 year'
      GROUP BY DATE(created_at)
    `, [req.user.id]);
    
    const blocksResult = await pool.query(`
      SELECT DATE(completed_at) as date, COUNT(*) as count
      FROM block_progress
      WHERE user_id = $1 AND completed = TRUE AND completed_at >= NOW() - INTERVAL '1 year'
      GROUP BY DATE(completed_at)
    `, [req.user.id]);

    const heatmap = {};
    result.rows.forEach(r => {
      // Need to adjust date format to YYYY-MM-DD
      const d = new Date(r.date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const dateStr = d.toISOString().split('T')[0];
      heatmap[dateStr] = parseInt(r.count, 10);
    });
    blocksResult.rows.forEach(r => {
      if (!r.date) return;
      const d = new Date(r.date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const dateStr = d.toISOString().split('T')[0];
      heatmap[dateStr] = (heatmap[dateStr] || 0) + parseInt(r.count, 10);
    });
    
    const heatmapArray = Object.keys(heatmap).map(date => ({ date, count: heatmap[date] }));
    res.json(heatmapArray);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching heatmap data" });
  }
});

app.post('/api/progress/code', authenticateToken, async (req, res) => {
  const { courseId, lessonId, code } = req.body;
  if (!courseId || !lessonId) return res.status(400).json({ error: "Course ID and Lesson ID are required" });
  try {
    await pool.query(`
      INSERT INTO saved_code (user_id, course_id, lesson_id, code) VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, course_id, lesson_id) DO UPDATE SET code = EXCLUDED.code
    `, [req.user.id, courseId, lessonId, code]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error saving code" });
  }
});

app.post('/api/progress/complete', authenticateToken, async (req, res) => {
  const { courseId, lessonId } = req.body;
  if (!courseId || !lessonId) return res.status(400).json({ error: "Course ID and Lesson ID are required" });
  try {
    const lessonRes = await pool.query('SELECT * FROM lessons WHERE id = $1 AND course_id = $2', [lessonId, courseId]);
    if (lessonRes.rowCount === 0) return res.status(404).json({ error: "Lesson not found in this course" });
    const progressRes = await pool.query('SELECT * FROM progress WHERE user_id = $1 AND course_id = $2', [req.user.id, courseId]);
    let completedLessons = [];
    let isAlreadyCompleted = false;
    if (progressRes.rowCount > 0) {
      completedLessons = progressRes.rows[0].completed_lessons || [];
      isAlreadyCompleted = completedLessons.includes(lessonId);
    }
    const allLessonsRes = await pool.query('SELECT id FROM lessons WHERE course_id = $1 ORDER BY subtitle ASC', [courseId]);
    const lessonIds = allLessonsRes.rows.map(r => r.id);
    const currentIdx = lessonIds.indexOf(lessonId);
    let nextLessonId = lessonId;
    if (currentIdx !== -1 && currentIdx < lessonIds.length - 1) nextLessonId = lessonIds[currentIdx + 1];
    if (!isAlreadyCompleted) completedLessons.push(lessonId);
    await pool.query(`
      INSERT INTO progress (user_id, course_id, completed_lessons, active_lesson_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, course_id) DO UPDATE SET completed_lessons = EXCLUDED.completed_lessons, active_lesson_id = EXCLUDED.active_lesson_id
    `, [req.user.id, courseId, completedLessons, nextLessonId]);
    let userUpdated = null;
    if (!isAlreadyCompleted) {
      const userRes = await pool.query('SELECT xp, achievements FROM users WHERE id = $1', [req.user.id]);
      let { xp, achievements } = userRes.rows[0];
      achievements = achievements || [];
      xp += 100;
      const hadFirstSteps = achievements.includes("First Steps");
      if (!hadFirstSteps) {
        achievements.push("First Steps");
        await pool.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, '🎉 Достижение получено!', 'Вы разблокировали достижение "First Steps"!', 'achievement', '/profile')`, [req.user.id]);
      }
      const courseDetailsRes = await pool.query('SELECT category, title FROM courses WHERE id = $1', [courseId]);
      const category = courseDetailsRes.rows[0].category;
      const courseTitle = courseDetailsRes.rows[0].title;
      if (completedLessons.length === lessonIds.length) {
        const badgeName = `${category} Master`;
        if (!achievements.includes(badgeName)) {
          achievements.push(badgeName);
          await pool.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, '🏆 Курс пройден!', $2, 'achievement', '/profile')`, [req.user.id, `Вы завершили курс "${courseTitle}" и получили звание "${badgeName}"!`]);
          await pool.query(`INSERT INTO activity_logs (user_id, action_type, target_name, target_link) VALUES ($1, 'course_completed', $2, $3)`, [req.user.id, courseTitle, `/courses/${courseId}`]);
        }
      }
      await pool.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, 'Урок завершен! +100 XP', $2, 'success', '/dashboard')`, [req.user.id, `Вы прошли урок "${lessonRes.rows[0].title}" и получили 100 XP.`]);
      await pool.query(`INSERT INTO activity_logs (user_id, action_type, target_name, target_link) VALUES ($1, 'lesson_completed', $2, $3)`, [req.user.id, lessonRes.rows[0].title, `/lesson/${courseId}`]);
      const userUpdateRes = await pool.query(`
        UPDATE users SET xp = $1, achievements = $2 WHERE id = $3
        RETURNING id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, cover_url
      `, [xp, achievements, req.user.id]);
      userUpdated = userUpdateRes.rows[0];
    } else {
      const userRes = await pool.query('SELECT id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, cover_url FROM users WHERE id = $1', [req.user.id]);
      userUpdated = userRes.rows[0];
    }
    res.json({ success: true, user: userUpdated, nextLessonId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error completing lesson" });
  }
});

// ============================================================
// ██████╗ JUDGE SYSTEM — CODE EXECUTION (PISTON API)
// ============================================================
app.post('/api/execute', authenticateToken, async (req, res) => {
  const { language, version, code, stdin = '', context = 'ide', context_id = null } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
  }

  // Language → Piston runtime map
  const PISTON_RUNTIMES = {
    python:     { language: 'python',     version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    typescript: { language: 'typescript', version: '5.0.3' },
    csharp:     { language: 'csharp',     version: '6.12.0' },
    java:       { language: 'java',       version: '15.0.2' },
    cpp:        { language: 'c++',        version: '10.2.0' },
    c:          { language: 'c',          version: '10.2.0' },
    go:         { language: 'go',         version: '1.16.2' },
    rust:       { language: 'rust',       version: '1.50.0' },
    php:        { language: 'php',        version: '8.2.3'  },
    ruby:       { language: 'ruby',       version: '3.0.1'  },
    sql:        { language: 'sqlite3',    version: '3.36.0' },
  };

  const runtime = PISTON_RUNTIMES[language.toLowerCase()] || { language: language.toLowerCase(), version: version || '*' };

  const pistonUrl = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';
  const useLocalFallback = pistonUrl.includes('emkc.org');
  const startTime = Date.now();

  try {
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    if (useLocalFallback) {
      const { execSync } = await import('child_process');
      const os = await import('os');
      
      const ext = language.toLowerCase() === 'python' ? 'py' : 'js';
      if (ext !== 'js' && ext !== 'py') {
        throw new Error(`Public Piston API is offline. The temporary local fallback only supports JavaScript and Python. Got: ${language}`);
      }

      const filename = `codeai_run_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
      const filepath = path.join(os.tmpdir(), filename);
      fs.writeFileSync(filepath, code);

      try {
        const cmd = ext === 'py' ? `python "${filepath}"` : `node "${filepath}"`;
        stdout = execSync(cmd, { 
          encoding: 'utf-8', 
          timeout: 5000, 
          input: stdin, 
          stdio: 'pipe',
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });
      } catch (err) {
        stdout = err.stdout || '';
        stderr = err.stderr || err.message;
        exitCode = err.status ?? 1;
      } finally {
        try { fs.unlinkSync(filepath); } catch (e) {}
      }
    } else {
      // Original Piston Logic
      const pistonRes = await fetch(`${pistonUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ name: getFilename(language), content: code }],
          stdin,
          compile_timeout: 10000,
          run_timeout: 5000
        })
      });

      if (!pistonRes.ok) {
        const errText = await pistonRes.text();
        throw new Error(`Piston API error ${pistonRes.status}: ${errText}`);
      }

      const data = await pistonRes.json();
      stdout = data.run?.stdout || '';
      stderr = data.run?.stderr || data.compile?.stderr || '';
      exitCode = data.run?.code ?? 1;
    }

    const timeMs = Date.now() - startTime;

    // Log execution to DB (non-blocking)
    pool.query(
      'INSERT INTO code_executions (user_id, language, version, code, stdout, stderr, exit_code, time_ms, context, context_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [req.user.id, language, runtime.version, code, stdout, stderr, exitCode, timeMs, context, context_id]
    ).catch(e => console.error('Execution log error:', e));

    res.json({ stdout, stderr, exit_code: exitCode, time_ms: timeMs, language: runtime.language });
  } catch (err) {
    console.error("Judge System error:", err.message);
    res.status(500).json({ error: "Code execution failed. Check server logs.", details: err.message });
  }
});

function getFilename(lang) {
  const map = { python: 'main.py', javascript: 'index.js', typescript: 'index.ts', csharp: 'main.cs', java: 'Main.java', cpp: 'main.cpp', c: 'main.c', go: 'main.go', rust: 'main.rs', php: 'main.php', ruby: 'main.rb', sql: 'query.sql' };
  return map[lang.toLowerCase()] || 'main.txt';
}

// ============================================================
// SKILLS API
// ============================================================
app.get('/api/skills', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching skills" });
  }
});

app.get('/api/skills/student', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sk.id, sk.name, sk.category, sk.icon,
             COALESCE(kn.score, 0) as score,
             COALESCE(kn.success_count, 0) as success_count,
             COALESCE(kn.error_count, 0) as error_count,
             COALESCE(kn.current_level, 'easy') as current_level,
             kn.last_activity
      FROM skills sk
      LEFT JOIN student_knowledge kn ON kn.skill_id = sk.id AND kn.user_id = $1
      ORDER BY sk.category, sk.name
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching student skills" });
  }
});

// Update student knowledge after code run
app.post('/api/skills/update', authenticateToken, async (req, res) => {
  const { skill_id, success } = req.body;
  if (!skill_id) return res.status(400).json({ error: "skill_id required" });
  try {
    const scoreChange = success ? 0.10 : -0.05;
    const existing = await pool.query('SELECT * FROM student_knowledge WHERE user_id=$1 AND skill_id=$2', [req.user.id, skill_id]);
    if (existing.rowCount === 0) {
      await pool.query(`
        INSERT INTO student_knowledge (user_id, skill_id, score, success_count, error_count)
        VALUES ($1, $2, $3, $4, $5)
      `, [req.user.id, skill_id, Math.max(0, Math.min(1, scoreChange)), success ? 1 : 0, success ? 0 : 1]);
    } else {
      const current = existing.rows[0];
      const newScore = Math.max(0, Math.min(1, parseFloat(current.score) + scoreChange));
      // AI Difficulty Scaling
      let newLevel = current.current_level;
      if (newScore > 0.85 && current.current_level === 'easy') newLevel = 'medium';
      else if (newScore > 0.90 && current.current_level === 'medium') newLevel = 'hard';
      else if (newScore < 0.40 && current.current_level === 'hard') newLevel = 'medium';
      else if (newScore < 0.35 && current.current_level === 'medium') newLevel = 'easy';
      await pool.query(`
        UPDATE student_knowledge SET
          score = $1,
          success_count = success_count + $2,
          error_count = error_count + $3,
          current_level = $4,
          last_activity = NOW()
        WHERE user_id = $5 AND skill_id = $6
      `, [newScore, success ? 1 : 0, success ? 0 : 1, newLevel, req.user.id, skill_id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating skill" });
  }
});

// ============================================================
// CHALLENGES API
// ============================================================
app.get('/api/challenges', authenticateToken, async (req, res) => {
  const { difficulty, topic, status, search } = req.query;
  try {
    let query = `
      SELECT c.*,
        COALESCE(
          (SELECT status FROM challenge_attempts ca WHERE ca.challenge_id = c.id AND ca.user_id = $1 ORDER BY ca.created_at DESC LIMIT 1),
          'not_started'
        ) as user_status,
        (SELECT COUNT(*) FROM challenge_attempts ca2 WHERE ca2.challenge_id = c.id AND ca2.status = 'accepted') as accepted_count,
        (SELECT COUNT(*) FROM challenge_attempts ca3 WHERE ca3.challenge_id = c.id) as total_attempts,
        ARRAY(
          SELECT t.name FROM tags t
          JOIN challenge_tags ct ON ct.tag_id = t.id
          WHERE ct.challenge_id = c.id
        ) as tags,
        ARRAY(
          SELECT s.name FROM skills s
          JOIN challenge_skills cs ON cs.skill_id = s.id
          WHERE cs.challenge_id = c.id
        ) as skills
      FROM challenges c
      WHERE c.is_published = TRUE
    `;
    const params = [req.user.id];
    let idx = 2;
    if (difficulty) { query += ` AND c.difficulty = $${idx++}`; params.push(difficulty); }
    if (search) { query += ` AND c.title ILIKE $${idx++}`; params.push(`%${search}%`); }
    query += ' ORDER BY c.id ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching challenges" });
  }
});

app.get('/api/teacher/challenges', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM challenge_attempts ca WHERE ca.challenge_id = c.id AND ca.status = 'accepted') as accepted_count,
        (SELECT COUNT(*) FROM challenge_attempts ca2 WHERE ca2.challenge_id = c.id) as total_attempts
      FROM challenges c
      WHERE c.created_by = $1
      ORDER BY c.id DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching teacher challenges" });
  }
});

app.get('/api/challenges/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT c.*,
        ARRAY(SELECT t.name FROM tags t JOIN challenge_tags ct ON ct.tag_id = t.id WHERE ct.challenge_id = c.id) as tags,
        ARRAY(SELECT s.name FROM skills s JOIN challenge_skills cs ON cs.skill_id = s.id WHERE cs.challenge_id = c.id) as skills
      FROM challenges c WHERE c.id = $1
    `, [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Challenge not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching challenge" });
  }
});

app.get('/api/challenges/:id/attempts', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM challenge_attempts WHERE user_id = $1 AND challenge_id = $2 ORDER BY created_at DESC',
      [req.user.id, id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching attempts" });
  }
});

app.post('/api/challenges/:id/submit', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { code, language } = req.body;
  if (!code || !language) return res.status(400).json({ error: "code and language are required" });

  try {
    const challengeRes = await pool.query('SELECT * FROM challenges WHERE id = $1', [id]);
    if (challengeRes.rowCount === 0) return res.status(404).json({ error: "Challenge not found" });
    const challenge = challengeRes.rows[0];

    // Count previous attempts
    const attemptCount = await pool.query(
      'SELECT COUNT(*) FROM challenge_attempts WHERE user_id=$1 AND challenge_id=$2',
      [req.user.id, id]
    );
    const attemptNum = parseInt(attemptCount.rows[0].count) + 1;

    // Run all test cases against Piston
    const testCases = challenge.test_cases || [];
    const PISTON_RUNTIMES = {
      python: { language: 'python', version: '3.10.0' },
      javascript: { language: 'javascript', version: '18.15.0' },
      csharp: { language: 'csharp', version: '6.12.0' },
      java: { language: 'java', version: '15.0.2' },
    };
    const runtime = PISTON_RUNTIMES[language.toLowerCase()] || { language: language.toLowerCase(), version: '*' };
    const pistonUrl = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';

    let finalCode = code;
    if (language.toLowerCase() === 'python') {
      finalCode = `${code}\n
import sys, json, inspect
def _codeai_run():
    input_str = sys.stdin.read().strip()
    if not input_str: return
    try:
        args = json.loads(input_str)
    except:
        return
    funcs = [f for f in globals().values() if inspect.isfunction(f) and f.__module__ == '__main__' and f.__name__ != '_codeai_run']
    if not funcs: return
    func = funcs[-1]
    res = func(*args) if isinstance(args, list) else func(args)
    print(json.dumps(res).replace(' ', ''))
if __name__ == '__main__':
    _codeai_run()
`;
    } else if (language.toLowerCase() === 'javascript') {
      const funcMatch = code.match(/function\s+([a-zA-Z0-9_]+)/) || code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>|[a-zA-Z0-9_]+\s*=>)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        finalCode = `${code}\n
const fs = require('fs');
const inputStr = fs.readFileSync(0, 'utf-8').trim();
if (inputStr) {
  try {
    const args = JSON.parse(inputStr);
    const res = Array.isArray(args) ? ${funcName}(...args) : ${funcName}(args);
    console.log(JSON.stringify(res).replace(/\\s/g, ''));
  } catch(e) {}
}
`;
      }
    }

    let allPassed = true;
    let firstError = '';
    let firstStdout = '';
    let totalTime = 0;
    const results = [];

    const crypto = await import('crypto');
    const { spawn } = await import('child_process');

    const runCodeLocally = (lang, codeContent, stdinStr, timeoutMs) => {
      return new Promise((resolve) => {
        const tmpDir = os.tmpdir();
        const filename = `codeai_${crypto.randomUUID()}.${lang === 'python' ? 'py' : 'js'}`;
        const filepath = path.join(tmpDir, filename);
        fs.writeFileSync(filepath, codeContent);
        
        const cmd = lang === 'python' ? 'python' : 'node';
        const child = spawn(cmd, [filepath]);
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', d => stdout += d.toString());
        child.stderr.on('data', d => stderr += d.toString());
        
        let timer = setTimeout(() => {
          child.kill('SIGKILL');
          resolve({ run: { stdout, stderr: 'Timeout exceeded', code: 1 } });
        }, timeoutMs);

        if (stdinStr) {
          child.stdin.write(stdinStr);
          child.stdin.end();
        }

        child.on('close', (code) => {
          clearTimeout(timer);
          try { fs.unlinkSync(filepath); } catch(e){}
          resolve({ run: { stdout, stderr, code } });
        });
        
        child.on('error', (err) => {
          clearTimeout(timer);
          try { fs.unlinkSync(filepath); } catch(e){}
          resolve({ run: { stdout, stderr: err.message, code: 1 } });
        });
      });
    };

    for (const tc of testCases) {
      const startT = Date.now();
      try {
        const pData = await runCodeLocally(language.toLowerCase(), finalCode, tc.stdin || '', challenge.time_limit_ms || 5000);
        
        const elapsed = Date.now() - startT;
        totalTime += elapsed;
        const stdout = (pData.run?.stdout || '').trim();
        const stderr = pData.run?.stderr || pData.compile?.stderr || '';
        const expected = (tc.expected_stdout || '').trim().replace(/\s/g, '');
        const passed = stdout.replace(/\s/g, '') === expected && !stderr && pData.run?.code === 0;
        results.push({ passed, stdout, expected, stderr, time_ms: elapsed });
        if (!passed) {
          allPassed = false;
          if (!firstError) firstError = stderr || `Expected: "${expected}", Got: "${stdout}"`;
          if (!firstStdout) firstStdout = stdout;
        }
      } catch (e) {
        allPassed = false;
        firstError = e.message;
        results.push({ passed: false, error: e.message });
      }
    }

    const status = testCases.length === 0 ? 'accepted' : (allPassed ? 'accepted' : 'wrong_answer');

    // Save attempt
    await pool.query(`
      INSERT INTO challenge_attempts (user_id, challenge_id, code, language, status, stdout, stderr, runtime_ms, attempt_num)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [req.user.id, id, code, language, status, firstStdout, firstError, totalTime, attemptNum]);

    // Award XP if first accepted
    if (status === 'accepted') {
      const prevAccepted = await pool.query(
        "SELECT id FROM challenge_attempts WHERE user_id=$1 AND challenge_id=$2 AND status='accepted' AND attempt_num < $3",
        [req.user.id, id, attemptNum]
      );
      if (prevAccepted.rowCount === 0) {
        const xpMap = { easy: 50, medium: 100, hard: 200 };
        const xp = xpMap[challenge.difficulty] || 50;
        await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xp, req.user.id]);
        await pool.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1,$2,$3,'achievement','/challenges')`,
          [req.user.id, `✅ Задача решена! +${xp} XP`, `Вы решили задачу "${challenge.title}"!`]);
        await pool.query(`INSERT INTO activity_logs (user_id, action_type, target_name, target_link) VALUES ($1, 'challenge_solved', $2, $3)`, [req.user.id, challenge.title, `/challenges/${id}`]);
      }
    }

    res.json({ status, results, attempt_num: attemptNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error submitting challenge" });
  }
});

// Teacher: create challenge
app.post('/api/challenges', authenticateToken, requireTeacher, async (req, res) => {
  const { title, difficulty, description, examples, test_cases, tags, skills } = req.body;
  if (!title || !description) return res.status(400).json({ error: "title and description required" });
  try {
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const result = await pool.query(`
      INSERT INTO challenges (title, slug, difficulty, description, examples, test_cases, created_by, is_published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE) RETURNING *
    `, [title, slug, difficulty || 'easy', description, JSON.stringify(examples || []), JSON.stringify(test_cases || []), req.user.id]);
    const challenge = result.rows[0];

    // Add tags
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tagRes = await pool.query('SELECT id FROM tags WHERE name=$1', [tagName]);
        if (tagRes.rowCount > 0) {
          await pool.query('INSERT INTO challenge_tags (challenge_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [challenge.id, tagRes.rows[0].id]);
        }
      }
    }
    // Add skills
    if (skills && Array.isArray(skills)) {
      for (const skillName of skills) {
        const skillRes = await pool.query('SELECT id FROM skills WHERE name=$1', [skillName]);
        if (skillRes.rowCount > 0) {
          await pool.query('INSERT INTO challenge_skills (challenge_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [challenge.id, skillRes.rows[0].id]);
        }
      }
    }
    res.status(201).json(challenge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating challenge" });
  }
});

// Publish/unpublish challenge
app.put('/api/challenges/:id/publish', authenticateToken, requireTeacher, async (req, res) => {
  const { id } = req.params;
  const { is_published } = req.body;
  try {
    await pool.query('UPDATE challenges SET is_published=$1 WHERE id=$2', [is_published, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Teacher: get ALL attempts for a challenge (any student)
app.get('/api/challenges/:id/all-attempts', authenticateToken, requireTeacher, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT ca.*, u.name as student_name, u.email as student_email
      FROM challenge_attempts ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.challenge_id = $1
      ORDER BY ca.created_at DESC
      LIMIT 100
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching all attempts" });
  }
});

// Add solution for a language
app.post('/api/challenges/:id/solutions', authenticateToken, requireTeacher, async (req, res) => {
  const { id } = req.params;
  const { language, solution_code, explanation } = req.body;
  if (!language || !solution_code) return res.status(400).json({ error: "language and solution_code required" });
  try {
    const result = await pool.query(`
      INSERT INTO challenge_solutions (challenge_id, language, solution_code, explanation)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (challenge_id, language) DO UPDATE SET solution_code=EXCLUDED.solution_code, explanation=EXCLUDED.explanation
      RETURNING *
    `, [id, language, solution_code, explanation]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error saving solution" });
  }
});

// ============================================================
// PROJECTS (IDE Projects)
// ============================================================
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id=$1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching projects" });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Project not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching project" });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  const { title, description, language, code, type = 'ide', source_id, tech_tags, is_public } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const result = await pool.query(`
      INSERT INTO projects (user_id, title, description, language, code, type, source_id, tech_tags, is_public)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.user.id, title, description, language, code, type, source_id, tech_tags || [], is_public || false]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating project" });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, code, tech_tags, is_public } = req.body;
  try {
    const result = await pool.query(`
      UPDATE projects SET title=COALESCE($1,title), description=COALESCE($2,description),
        code=COALESCE($3,code), tech_tags=COALESCE($4,tech_tags), is_public=COALESCE($5,is_public),
        updated_at=NOW()
      WHERE id=$6 AND user_id=$7 RETURNING *
    `, [title, description, code, tech_tags, is_public, id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Project not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating project" });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting project" });
  }
});

// ============================================================
// LEARNING PATHS API
// ============================================================

// Ensure learning_paths tables exist
const ensureLearningPathsSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS learning_paths (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      difficulty VARCHAR(50) DEFAULT 'Beginner',
      color VARCHAR(20) DEFAULT '#6366f1',
      estimated_hours FLOAT DEFAULT 0,
      is_featured BOOLEAN DEFAULT FALSE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Ensure the column exists if the table was created before it was added to the schema
  await pool.query(`ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS learning_path_courses (
      id SERIAL PRIMARY KEY,
      path_id INTEGER REFERENCES learning_paths(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      UNIQUE(path_id, course_id)
    );
  `);
};
ensureLearningPathsSchema().catch(e => console.error('LP schema error:', e));

app.get('/api/learning-paths', authenticateToken, async (req, res) => {
  try {
    const paths = await pool.query('SELECT * FROM learning_paths ORDER BY is_featured DESC, id ASC');
    const result = [];
    for (const path of paths.rows) {
      const courseRows = await pool.query(`
        SELECT c.* FROM courses c
        JOIN learning_path_courses lpc ON lpc.course_id = c.id
        WHERE lpc.path_id = $1
        ORDER BY lpc.order_index ASC
      `, [path.id]);
      // Get lessons for each course
      const coursesWithLessons = [];
      for (const course of courseRows.rows) {
        const lessons = await pool.query('SELECT * FROM lessons WHERE course_id=$1 ORDER BY order_index', [course.id]);
        coursesWithLessons.push({ ...course, lessons: lessons.rows });
      }
      result.push({ ...path, courses: coursesWithLessons });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching learning paths' });
  }
});

app.post('/api/learning-paths', authenticateToken, requireTeacher, async (req, res) => {
  const { title, description, difficulty, color, course_ids, estimated_hours, is_featured } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const result = await pool.query(`
      INSERT INTO learning_paths (title, description, difficulty, color, estimated_hours, is_featured, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [title, description, difficulty || 'Beginner', color || '#6366f1', estimated_hours || 0, is_featured || false, req.user.id]);
    const path = result.rows[0];
    if (course_ids && Array.isArray(course_ids)) {
      for (let i = 0; i < course_ids.length; i++) {
        await pool.query('INSERT INTO learning_path_courses (path_id, course_id, order_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [path.id, course_ids[i], i]);
      }
    }
    res.status(201).json(path);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating learning path' });
  }
});

app.delete('/api/learning-paths/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    await pool.query('DELETE FROM learning_paths WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ============================================================
// NOTIFICATIONS
// ============================================================
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching notifications" });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 OR user_id IS NULL', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================================
// ADMIN PANEL
// ============================================================
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersCount = parseInt((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count);
    const activeUsers = parseInt((await pool.query("SELECT COUNT(*) FROM users WHERE streak > 1 OR study_time_seconds > 0")).rows[0].count);
    const avgXP = Math.round(parseFloat((await pool.query('SELECT AVG(xp) FROM users')).rows[0].avg || 0));
    const totalStudyHours = Math.round(parseFloat((await pool.query('SELECT SUM(study_time_seconds) FROM users')).rows[0].sum || 0) / 3600);
    const completedLessonsRes = await pool.query('SELECT completed_lessons FROM progress');
    let completedLessons = 0;
    completedLessonsRes.rows.forEach(p => { completedLessons += (p.completed_lessons || []).length; });
    const challengesSolved = parseInt((await pool.query("SELECT COUNT(DISTINCT(user_id, challenge_id)) FROM challenge_attempts WHERE status='accepted'")).rows[0].count || 0);
    res.json({ users: usersCount, activeUsers, avgXP, totalStudyHours, completedLessons, challengesSolved, newUsersThisWeek: Math.max(1, Math.round(usersCount * 0.15)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, xp, streak, achievements, location, bio, joined_date, study_time_seconds, has_completed_onboarding, avatar_url, is_banned FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'teacher', 'admin'].includes(role)) return res.status(400).json({ error: "Invalid role value" });
  try {
    const targetUser = await pool.query('SELECT name, role FROM users WHERE id = $1', [id]);
    if (targetUser.rowCount === 0) return res.status(404).json({ error: "User not found" });
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: "You cannot change your own admin role" });
    const { name: targetName, role: oldRole } = targetUser.rows[0];
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    await pool.query('INSERT INTO admin_logs (admin_id, admin_name, action) VALUES ($1, $2, $3)', [req.user.id, req.user.name || 'Admin', `Changed role of ${targetName} from '${oldRole}' to '${role}'`]);
    await pool.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1,'Role Updated','Your role has been updated to ${role}.','info','/profile')`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/admin/users/:id/xp', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  if (typeof amount !== 'number' || isNaN(amount)) return res.status(400).json({ error: "XP amount must be a number" });
  try {
    const targetUser = await pool.query('SELECT name, xp FROM users WHERE id = $1', [id]);
    if (targetUser.rowCount === 0) return res.status(404).json({ error: "User not found" });
    const newXp = Math.max(0, targetUser.rows[0].xp + amount);
    await pool.query('UPDATE users SET xp = $1 WHERE id = $2', [newXp, id]);
    await pool.query('INSERT INTO admin_logs (admin_id, admin_name, action) VALUES ($1, $2, $3)', [req.user.id, req.user.name || 'Admin', `Modified XP for ${targetUser.rows[0].name} by ${amount > 0 ? '+' : ''}${amount} (new: ${newXp})`]);
    await pool.query(`INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1,'XP Awarded!','Admin awarded you ${amount} XP!','achievement','/profile')`, [id]);
    res.json({ success: true, newXp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put('/api/admin/users/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { ban } = req.body;
  try {
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: "You cannot ban yourself" });
    const targetUser = await pool.query('SELECT name FROM users WHERE id = $1', [id]);
    if (targetUser.rowCount === 0) return res.status(404).json({ error: "User not found" });
    await pool.query('UPDATE users SET is_banned = $1 WHERE id = $2', [ban, id]);
    await pool.query('INSERT INTO admin_logs (admin_id, admin_name, action) VALUES ($1, $2, $3)', [req.user.id, req.user.name || 'Admin', `${ban ? 'Banned' : 'Unbanned'} user ${targetUser.rows[0].name} (ID: ${id})`]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: "You cannot delete yourself" });
    const targetUser = await pool.query('SELECT name FROM users WHERE id = $1', [id]);
    if (targetUser.rowCount === 0) return res.status(404).json({ error: "User not found" });
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    await pool.query('INSERT INTO admin_logs (admin_id, admin_name, action) VALUES ($1, $2, $3)', [req.user.id, req.user.name || 'Admin', `Deleted user ${targetUser.rows[0].name} (ID: ${id})`]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/admin/notifications', authenticateToken, requireAdmin, async (req, res) => {
  const { userId, title, message, type, link } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title and message are required" });
  try {
    if (userId) {
      const userCheck = await pool.query('SELECT id, name FROM users WHERE id = $1', [userId]);
      if (userCheck.rowCount === 0) return res.status(404).json({ error: "User not found" });
      await pool.query('INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)', [userId, title, message, type || 'info', link || null]);
      await pool.query('INSERT INTO admin_logs (admin_id, admin_name, action) VALUES ($1, $2, $3)', [req.user.id, req.user.name || 'Admin', `Sent notification to ${userCheck.rows[0].name}: "${title}"`]);
    } else {
      await pool.query('INSERT INTO notifications (user_id, title, message, type, link) VALUES (NULL, $1, $2, $3, $4)', [title, message, type || 'info', link || null]);
      await pool.query('INSERT INTO admin_logs (admin_id, admin_name, action) VALUES ($1, $2, $3)', [req.user.id, req.user.name || 'Admin', `Broadcast notification: "${title}"`]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Teacher stats
app.get('/api/teacher/stats', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const myChallenges = await pool.query('SELECT id, title, difficulty FROM challenges WHERE created_by=$1', [req.user.id]);
    const challengeStats = [];
    for (const ch of myChallenges.rows) {
      const total = parseInt((await pool.query('SELECT COUNT(*) FROM challenge_attempts WHERE challenge_id=$1', [ch.id])).rows[0].count);
      const accepted = parseInt((await pool.query("SELECT COUNT(*) FROM challenge_attempts WHERE challenge_id=$1 AND status='accepted'", [ch.id])).rows[0].count);
      challengeStats.push({ ...ch, total_attempts: total, accepted, fail_rate: total > 0 ? Math.round(((total - accepted) / total) * 100) : 0 });
    }
    const textPending = await pool.query(`
      SELECT ts.*, u.name as student_name FROM text_submissions ts
      JOIN users u ON u.id = ts.user_id WHERE ts.status='ai_reviewed' OR ts.status='pending'
      ORDER BY ts.created_at DESC LIMIT 20
    `);
    
    // Add course stats
    const courseStats = [];
    const myCourses = await pool.query('SELECT id, title, category, level FROM courses WHERE created_by=$1', [req.user.id]);
    for (const c of myCourses.rows) {
      const enrollments = parseInt((await pool.query('SELECT COUNT(*) FROM course_enrollments WHERE course_id=$1', [c.id])).rows[0].count);
      const lessonCount = parseInt((await pool.query('SELECT COUNT(*) FROM lessons WHERE course_id=$1', [c.id])).rows[0].count);
      courseStats.push({ ...c, enrollments, lessons: lessonCount });
    }

    res.json({ challenge_stats: challengeStats, pending_reviews: textPending.rows, course_stats: courseStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================================
// AI — Ollama (local) + Google Gemini (cloud) dual-provider
// ============================================================

// ── Ollama config ──────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || 'qwen3:8b';
const AI_TIMEOUT_MS = 120000;

// ── Gemini config ──────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// ── Model registry ─────────────────────────────────────────
const AI_MODELS = [
  // Local (Ollama)
  { id: 'qwen3:8b',             name: 'Qwen3 8B',              provider: 'ollama',  description: 'Быстрая, для большинства задач',     size: '~5 GB' },
  { id: 'qwen3:14b',            name: 'Qwen3 14B',             provider: 'ollama',  description: 'Мощная, для сложных объяснений',     size: '~9 GB' },
  { id: 'auto',                 name: 'Авто (Gemini 2.5 Flash)', provider: 'gemini',  description: 'Использует Gemini 2.5 Flash',        size: 'Cloud' },
  // Cloud (Google Gemini / Google AI Studio)
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini',  description: 'Самая быстрая, экономит лимиты',    size: 'Cloud' },
  { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash',      provider: 'gemini',  description: 'Быстрая и умная, для большинства задач', size: 'Cloud' },
  { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro',        provider: 'gemini',  description: 'Лучшее качество, медленнее',        size: 'Cloud' },
  { id: 'gemma-2-27b-it',        name: 'Gemma 2 27B',           provider: 'gemini',  description: 'Мощная модель Gemma (через Google)', size: 'Cloud' },
];

// ── Helper: is this a Gemini API model? ────────────────────────
const isGeminiModel = (model) => model && (model.startsWith('gemini-') || model.startsWith('gemma-'));

// ── Ollama model cache (30s TTL) ───────────────────────────
let _ollamaModelsCache = null;
let _ollamaModelsCacheAt = 0;
const MODELS_CACHE_TTL = 30_000;

const getOllamaModels = async () => {
  const now = Date.now();
  if (_ollamaModelsCache && now - _ollamaModelsCacheAt < MODELS_CACHE_TTL) {
    return _ollamaModelsCache;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return (_ollamaModelsCache = []);
    const data = await res.json();
    _ollamaModelsCache = (data.models || []).map(m => m.name);
    _ollamaModelsCacheAt = now;
    return _ollamaModelsCache;
  } catch {
    return (_ollamaModelsCache = []);
  }
};

// ── Auto model resolution ────────────────────
const resolveModel = (model, messages = []) => {
  if (model === 'auto') return 'gemini-2.5-flash';
  if (!model) return OLLAMA_DEFAULT_MODEL;
  return model;
};

// ── System prompts ─────────────────────────────────────────
const SYSTEM_PROMPT_DEFAULT = `Ты — ИИ-ассистент для обучения программированию на платформе CodeAI.
Помогай студентам разбираться в коде, объясняй ошибки, давай советы по написанию чистого кода.
Отвечай на том языке, на котором задан вопрос (русский, казахский или английский).
Будь дружелюбным, понятным и конкретным. Используй примеры кода там, где это уместно.`;

const SYSTEM_PROMPT_LEARNING = `Ты — ИИ-наставник по программированию на платформе CodeAI.
Твоя цель — помочь студенту НАУЧИТЬСЯ, а не просто дать готовый ответ.

Правила:
1. НЕ давай готовое решение задачи сразу — только если студент явно попросил после нескольких попыток.
2. Сначала объясни концепцию или принцип, лежащий в основе задачи.
3. Подсказывай следующий шаг, а не всё решение целиком.
4. Задавай наводящие вопросы: "А что произойдёт, если...?", "Какой тип данных здесь нужен?".
5. Хвали за правильные шаги, мягко указывай на ошибки.
6. Если студент явно просит код — покажи, но объясни каждую строку.

Отвечай на том языке, на котором задан вопрос (русский, казахский или английский).`;

// ── Gemini SSE streamer ─────────────────────────────────────
// Streams Gemini API response as SSE tokens in the same format as Ollama streamer.
// Uses the server-sent events endpoint: streamGenerateContent
const streamGemini = async (messages, modelId, systemPrompt, res, controller) => {
  if (!GEMINI_API_KEY) {
    res.write(`data: ${JSON.stringify({ error: 'Google Gemini API key не настроен. Добавь GEMINI_API_KEY в server/.env' })}\n\n`);
    res.end();
    return;
  }

  // Convert chat messages to Gemini format
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' || m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: geminiContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };

  // Use streamGenerateContent for SSE streaming
  const url = `${GEMINI_BASE_URL}/models/${modelId}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      let errMsg = `Gemini API error ${geminiRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errMsg;
      } catch {}
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
      return;
    }

    // Parse SSE stream from Gemini
    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        if (raw === '[DONE]') {
          res.write(`data: ${JSON.stringify({ done: true, model: modelId })}\n\n`);
          continue;
        }
        try {
          const chunk = JSON.parse(raw);
          // Gemini streaming format: candidates[0].content.parts[0].text
          const token = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (token) res.write(`data: ${JSON.stringify({ token, model: modelId })}\n\n`);
          // Check for finishReason to send done signal
          const finishReason = chunk.candidates?.[0]?.finishReason;
          if (finishReason && finishReason !== 'STOP' && finishReason !== '') {
            // Not an error, just done
          }
          if (chunk.candidates?.[0]?.finishReason === 'STOP') {
            res.write(`data: ${JSON.stringify({ done: true, model: modelId })}\n\n`);
          }
        } catch { /* malformed chunk */ }
      }
    }
    res.end();
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    res.write(`data: ${JSON.stringify({ error: isTimeout ? `Превышено время ожидания (${AI_TIMEOUT_MS / 1000}с) — Gemini не ответил` : `Ошибка Gemini: ${err.message}` })}\n\n`);
    res.end();
  }
};

// ── Ollama SSE streamer ─────────────────────────────────────
const streamOllama = async (messages, modelId, systemPrompt, res, controller) => {
  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: ollamaMessages,
        stream: true,
        options: { temperature: 0.7, num_predict: 1024 }
      }),
      signal: controller.signal
    });

    if (!ollamaRes.ok) {
      res.write(`data: ${JSON.stringify({ error: `Ollama error ${ollamaRes.status}: модель "${modelId}" не загружена? Выполни: ollama pull ${modelId}` })}\n\n`);
      res.end();
      return;
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          const token = chunk.message?.content || chunk.response || '';
          if (token) res.write(`data: ${JSON.stringify({ token, model: modelId })}\n\n`);
          if (chunk.done) res.write(`data: ${JSON.stringify({ done: true, model: modelId })}\n\n`);
        } catch { /* skip */ }
      }
    }
    res.end();
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    res.write(`data: ${JSON.stringify({ error: isTimeout ? `Таймаут (${AI_TIMEOUT_MS / 1000}с) — Ollama не ответил` : `Ollama недоступен: ${err.message}` })}\n\n`);
    res.end();
  }
};

// GET /api/ai/models — list all models with availability status
app.get('/api/ai/models', async (req, res) => {
  try {
    const availableOllamaModels = await getOllamaModels();
    const geminiAvailable = !!GEMINI_API_KEY;

    const models = AI_MODELS.map(m => {
      if (m.provider === 'gemini') {
        return { ...m, available: geminiAvailable };
      }
      if (m.id === 'auto') {
        return { ...m, available: true }; // auto is always selectable
      }
      return {
        ...m,
        available: availableOllamaModels.some(am => am.startsWith(m.id.split(':')[0]))
      };
    });

    res.json({
      models,
      ollamaOnline: availableOllamaModels.length > 0,
      geminiAvailable,
      defaultModel: OLLAMA_DEFAULT_MODEL
    });
  } catch (err) {
    res.json({
      models: AI_MODELS.map(m => ({ ...m, available: m.id === 'auto' || (m.provider === 'gemini' && !!GEMINI_API_KEY) })),
      ollamaOnline: false,
      geminiAvailable: !!GEMINI_API_KEY,
      defaultModel: OLLAMA_DEFAULT_MODEL
    });
  }
});

// ── AI Chat History Endpoints ─────────────────────────────────

app.get('/api/ai/chats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, created_at, updated_at 
      FROM ai_chats 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

app.post('/api/ai/chats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      INSERT INTO ai_chats (user_id) VALUES ($1) RETURNING *
    `, [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create chat" });
  }
});

app.delete('/api/ai/chats/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM ai_chats WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

app.put('/api/ai/chats/:id', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  try {
    const result = await pool.query(`
      UPDATE ai_chats SET title = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND user_id = $3 RETURNING *
    `, [title, req.params.id, req.user.id]);
    
    if (result.rowCount === 0) return res.status(404).json({ error: "Chat not found or unauthorized" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update chat" });
  }
});

app.get('/api/ai/chats/:id/messages', authenticateToken, async (req, res) => {
  try {
    const chatRes = await pool.query('SELECT user_id FROM ai_chats WHERE id = $1', [req.params.id]);
    if (chatRes.rowCount === 0 || chatRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const msgRes = await pool.query(`
      SELECT id, role, content, created_at 
      FROM ai_chat_messages 
      WHERE chat_id = $1 
      ORDER BY id ASC
    `, [req.params.id]);
    res.json(msgRes.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post('/api/ai/chats/:id/messages', authenticateToken, async (req, res) => {
  const { role, content } = req.body;
  if (!role || !content) return res.status(400).json({ error: "Missing role or content" });
  try {
    const chatRes = await pool.query('SELECT user_id FROM ai_chats WHERE id = $1', [req.params.id]);
    if (chatRes.rowCount === 0 || chatRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    if (role === 'user') {
      const msgCountRes = await pool.query('SELECT COUNT(*) as count FROM ai_chat_messages WHERE chat_id = $1', [req.params.id]);
      if (parseInt(msgCountRes.rows[0].count, 10) === 0) {
        let newTitle = content.substring(0, 30);
        if (content.length > 30) newTitle += '...';
        await pool.query('UPDATE ai_chats SET title = $1 WHERE id = $2', [newTitle, req.params.id]);
      }
    }

    const result = await pool.query(`
      INSERT INTO ai_chat_messages (chat_id, role, content) 
      VALUES ($1, $2, $3) RETURNING *
    `, [req.params.id, role, content]);

    await pool.query('UPDATE ai_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

// POST /api/ai/chat — SSE streaming (Ollama OR Gemini, auto-detected by model name)
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const { messages = [], model, mode } = req.body;
  // Resolve 'auto' → actual Ollama model; Gemini models pass through as-is
  const selectedModel = isGeminiModel(model) ? model : resolveModel(model, messages);

  const systemContent = mode === 'learning' ? SYSTEM_PROMPT_LEARNING : SYSTEM_PROMPT_DEFAULT;

  // Normalise messages to { role: 'user'|'assistant', content } format
  const normalised = messages.map(m => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content
  }));

  // SSE headers — same for both providers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  req.on('aborted', () => { clearTimeout(timer); controller.abort(); });

  if (isGeminiModel(selectedModel)) {
    await streamGemini(normalised, selectedModel, systemContent, res, controller);
  } else {
    await streamOllama(normalised, selectedModel, systemContent, res, controller);
  }

  clearTimeout(timer);
});

// POST /api/ai/review — structured code review (Ollama OR Gemini)
app.post('/api/ai/review', authenticateToken, async (req, res) => {
  const { code, language = 'code', model } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  const selectedModel = isGeminiModel(model) ? model : resolveModel(model, [{ content: code }]);

  const reviewPrompt = `Проведи code review следующего кода на ${language}.
Оцени по 4 критериям от 1 до 10 и дай рекомендации.
ВАЖНО: верни ТОЛЬКО валидный JSON без markdown-блоков, без пояснений вокруг, только сам JSON объект.

Формат ответа (строго JSON):
{
  "readability": 8,
  "architecture": 7,
  "optimization": 6,
  "security": 9,
  "summary": "Краткое описание качества кода (2-3 предложения)",
  "improvements": ["Рекомендация 1", "Рекомендация 2", "Рекомендация 3"]
}

Код для анализа:
\`\`\`${language}
${code.slice(0, 4000)}
\`\`\``;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  // Helper to parse and return review JSON from a raw string
  const sendReviewResult = (raw, model) => {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ readability: 5, architecture: 5, optimization: 5, security: 5, summary: cleaned.slice(0, 300), improvements: [], model });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const clamp = (v) => Math.min(10, Math.max(1, Number(v) || 5));
    res.json({
      readability:  clamp(parsed.readability),
      architecture: clamp(parsed.architecture),
      optimization: clamp(parsed.optimization),
      security:     clamp(parsed.security),
      summary:      parsed.summary || '',
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
      model
    });
  };

  try {
    if (isGeminiModel(selectedModel)) {
      // ── Gemini review (non-streaming) ──────────────────────
      if (!GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY не настроен в server/.env' });

      const url = `${GEMINI_BASE_URL}/models/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: reviewPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return res.status(503).json({ error: `Gemini API error ${geminiRes.status}: ${errText.slice(0, 200)}` });
      }
      const gData = await geminiRes.json();
      const raw = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return sendReviewResult(raw, selectedModel);

    } else {
      // ── Ollama review (non-streaming) ──────────────────────
      const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: reviewPrompt }],
          stream: false,
          options: { temperature: 0.3, num_predict: 512 }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!ollamaRes.ok) return res.status(503).json({ error: `Ollama error: ${ollamaRes.status}` });
      const data = await ollamaRes.json();
      const raw = data.message?.content || data.response || '';
      return sendReviewResult(raw, selectedModel);
    }
  } catch (err) {
    clearTimeout(timer);
    console.error('AI review error:', err.message);
    const isTimeout = err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 503).json({
      error: isTimeout
        ? `Ревью заняло слишком долго (>${AI_TIMEOUT_MS / 1000}с). Попробуй модель Flash Lite.`
        : `Ошибка AI: ${err.message}`
    });
  }
});

// ============================================================
// SERVE FRONTEND STATIC FILES
// ============================================================
const frontendDistPath = path.join(__dirname, '../dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
  // Let API and upload requests return 404 instead of index.html
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ============================================================
// START SERVER & WEBSOCKETS (Interactive Terminal)
// ============================================================
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const workspacesDir = path.join(__dirname, 'workspaces');
if (!fs.existsSync(workspacesDir)) fs.mkdirSync(workspacesDir, { recursive: true });

io.on('connection', (socket) => {
  console.log('Client connected to terminal socket:', socket.id);
  let ptyProcess = null;

  // Sync virtual files to real disk to allow the terminal to interact with them
  socket.on('sync_files', ({ projectId, files }) => {
    if (!projectId || !files || !Array.isArray(files)) return;
    const projectDir = path.join(workspacesDir, projectId.toString());
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
    
    // Helper to build full path based on parentId
    const buildPath = (item) => {
      let current = item;
      let p = current.name || current.title;
      while (current.parentId) {
        const parent = files.find(f => f.id === current.parentId);
        if (!parent) break;
        p = path.join(parent.name || parent.title, p);
        current = parent;
      }
      return p;
    };

    files.forEach(file => {
      if (!file.name && !file.title) return;
      const fullPath = path.join(projectDir, buildPath(file));
      
      if (file.type === 'folder') {
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
      } else {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const content = file.content !== undefined ? file.content : (file.code !== undefined ? file.code : '');
        fs.writeFileSync(fullPath, content);
      }
    });
    
    // Spawn terminal in that directory if not already spawned
    if (!ptyProcess) {
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      try {
        ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
          cwd: projectDir,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
          useConpty: false
        });
        
        ptyProcess.onData((data) => {
          socket.emit('terminal.incData', data);
        });
      } catch (err) {
        console.error("Failed to spawn PTY:", err);
        socket.emit('terminal.incData', `\r\n\x1b[31m[Error] Failed to start terminal: ${err.message}\x1b[0m\r\n`);
      }
    }
  });

  // Receive keystrokes from browser
  socket.on('terminal.toTerm', (data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  // Handle resizing
  socket.on('terminal.resize', ({ cols, rows }) => {
    if (ptyProcess) {
      try { ptyProcess.resize(cols, rows); } catch(e){}
    }
  });

  socket.on('disconnect', () => {
    if (ptyProcess) {
      try { ptyProcess.kill(); } catch(e){}
    }
  });
});

server.listen(PORT, () => {
  console.log(`CodeAI backend API server running on port ${PORT}`);
  console.log(`WebSockets & PTY interactive terminal enabled.`);
  console.log(`Judge System: Piston API fallback enabled (local exec)`);
  console.log(`AI (Ollama): ${OLLAMA_URL} | Default model: ${OLLAMA_DEFAULT_MODEL}`);
  console.log(`AI (Gemini): ${GEMINI_API_KEY ? '✅ API key configured' : '❌ No GEMINI_API_KEY — set it in server/.env'}`);
});
