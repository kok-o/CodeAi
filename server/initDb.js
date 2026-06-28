import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Client } = pg;

const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const DB_NAME = process.env.DB_NAME || 'codeai';

const seedCourses = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    level: "Beginner",
    students: "0",
    rating: 0.0,
    category: "JavaScript",
    color: "#f7df1e",
    description: "Learn the core basics of JavaScript including variables, data types, and functions.",
    image_url: "/assets/js.png",
    lessons: [
      {
        id: "js-lesson-1",
        title: "Introduction to Variables",
        subtitle: "Lesson 1",
        estimatedTime: "5 mins",
        instructions: "Read the theory",
        initialCode: "",
        language: "javascript",
        testCases: [],
        solutionCode: "",
        blocks: [
          {
            type: "theory",
            content: {
              title: "What is a Variable?",
              body: "<p>Variables are containers for storing data values.</p><p>In JavaScript, we use <code>let</code> and <code>const</code> to declare variables.</p><pre><code>let age = 25;\nconst name = 'Alice';</code></pre>"
            }
          }
        ]
      },
      {
        id: "js-lesson-2",
        title: "Data Types",
        subtitle: "Lesson 2",
        estimatedTime: "5 mins",
        instructions: "Read the theory",
        initialCode: "",
        language: "javascript",
        testCases: [],
        solutionCode: "",
        blocks: [
          {
            type: "theory",
            content: {
              title: "Primitive Data Types",
              body: "<p>JavaScript has several primitive data types:</p><ul><li><strong>String:</strong> Text data, e.g., 'Hello'</li><li><strong>Number:</strong> Numeric data, e.g., 42</li><li><strong>Boolean:</strong> True or False</li></ul>"
            }
          }
        ]
      },
      {
        id: "js-lesson-3",
        title: "Functions",
        subtitle: "Lesson 3",
        estimatedTime: "5 mins",
        instructions: "Read the theory",
        initialCode: "",
        language: "javascript",
        testCases: [],
        solutionCode: "",
        blocks: [
          {
            type: "theory",
            content: {
              title: "What is a Function?",
              body: "<p>A JavaScript function is a block of code designed to perform a particular task.</p><pre><code>function greet() {\n  console.log('Hello!');\n}</code></pre>"
            }
          }
        ]
      },
      {
        id: "js-lesson-4",
        title: "Knowledge Check",
        subtitle: "Lesson 4",
        estimatedTime: "10 mins",
        instructions: "Take the quiz",
        initialCode: "",
        language: "javascript",
        testCases: [],
        solutionCode: "",
        blocks: [
          {
            type: "quiz",
            content: {
              question: "Which keyword is used to declare a variable that cannot be reassigned?",
              options: ["let", "var", "const", "static"],
              correct_index: 2,
              explanation: "The const keyword creates a read-only reference to a value."
            }
          }
        ]
      },
      {
        id: "js-lesson-5",
        title: "Practice: Your First Function",
        subtitle: "Lesson 5",
        estimatedTime: "15 mins",
        instructions: "Write a function named `add` that takes two parameters, `a` and `b`, and returns their sum.",
        initialCode: "function add(a, b) {\n  // Write your code here\n}",
        language: "javascript",
        testCases: [
          { input: [2, 3], expected: 5, type: "return", functionName: "add" },
          { input: [-1, 5], expected: 4, type: "return", functionName: "add" }
        ],
        solutionCode: "function add(a, b) {\n  return a + b;\n}",
        blocks: [
          {
            type: "practice",
            content: {
              instructions: "Write a function named `add` that takes two parameters, `a` and `b`, and returns their sum.",
              initial_code: "function add(a, b) {\n  // Write your code here\n}",
              solution_code: "function add(a, b) {\n  return a + b;\n}",
              language: "javascript",
              test_cases: [
                { input: [2, 3], expected: 5, type: "return", functionName: "add" },
                { input: [-1, 5], expected: 4, type: "return", functionName: "add" }
              ]
            }
          }
        ]
      }
    ]
  }
];

async function run() {
  let client;

  if (process.env.DATABASE_URL) {
    // On Render/Production, database is already created and we use connectionString
    console.log("Using DATABASE_URL, skipping database creation...");
    client = new Client(dbConfig);
    await client.connect();
  } else {
    // 1. Connect to postgres database to ensure target DB exists
    const pgClient = new Client({ ...dbConfig, database: 'postgres' });
    try {
      await pgClient.connect();
      
      // Check if codeai database exists
      const res = await pgClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
      if (res.rowCount === 0) {
        console.log(`Database "${DB_NAME}" does not exist. Creating...`);
        // CREATE DATABASE cannot run inside a transaction block, so running direct query
        await pgClient.query(`CREATE DATABASE "${DB_NAME}"`);
        console.log(`Database "${DB_NAME}" created successfully.`);
      } else {
        console.log(`Database "${DB_NAME}" already exists.`);
      }
    } catch (err) {
      console.error("Error checking or creating database:", err);
      process.exit(1);
    } finally {
      await pgClient.end();
    }

    // 2. Connect to the newly created/existing target database
    client = new Client({ ...dbConfig, database: DB_NAME });
    await client.connect();
  }

  try {
    console.log(`Connected to target database. Creating tables...`);

    // Reset database schema for clean migration
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DROP_TABLES === 'true') {
      console.warn("WARNING: Dropping all tables and resetting schema...");
      await client.query(`DROP TABLE IF EXISTS saved_code, progress, lesson_blocks, block_progress, quiz_attempts, lessons, courses, users, notifications, admin_logs CASCADE;`);
    } else {
      console.log("Skipping table drop (production mode). Set ALLOW_DROP_TABLES='true' to force reset.");
    }

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        location VARCHAR(255) DEFAULT 'Earth',
        bio TEXT DEFAULT 'Learning to code!',
        joined_date VARCHAR(255) NOT NULL,
        study_time_seconds INTEGER DEFAULT 0,
        has_completed_onboarding BOOLEAN DEFAULT FALSE,
        avatar_url TEXT DEFAULT NULL,
        cover_url TEXT DEFAULT NULL,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        achievements TEXT[] DEFAULT ARRAY[]::TEXT[]
      )
    `);

    // Create courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        level VARCHAR(100) DEFAULT 'Beginner',
        students VARCHAR(50) DEFAULT '0',
        rating NUMERIC(3, 2) DEFAULT 0.0,
        category VARCHAR(100) NOT NULL,
        color VARCHAR(50) DEFAULT '#3776ab',
        description TEXT,
        image_url TEXT,
        is_published BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id)
      )
    `);

    // Create lessons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id VARCHAR(100) PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(100) NOT NULL,
        estimated_time VARCHAR(50) NOT NULL,
        instructions TEXT NOT NULL,
        initial_code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        test_cases JSONB NOT NULL,
        solution_code TEXT NOT NULL
      )
    `);

    // Create lesson_blocks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_blocks (
        id SERIAL PRIMARY KEY,
        lesson_id VARCHAR(255) REFERENCES lessons(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        order_index INTEGER NOT NULL,
        content JSONB NOT NULL,
        skill_id VARCHAR(255)
      )
    `);

    // Create progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS progress (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        completed_lessons TEXT[] DEFAULT ARRAY[]::TEXT[],
        active_lesson_id VARCHAR(100),
        PRIMARY KEY (user_id, course_id)
      )
    `);

    // Create block_progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS block_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        block_id INTEGER REFERENCES lesson_blocks(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        score INTEGER DEFAULT 0,
        saved_code TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, block_id)
      )
    `);

    // Create saved_code table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_code (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        lesson_id VARCHAR(100) REFERENCES lessons(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        PRIMARY KEY (user_id, course_id, lesson_id)
      )
    `);

    // Create course_ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_ratings (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id, user_id)
      )
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        link VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        admin_name VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Tables created successfully. Seeding initial data...");

    // Check if courses are already seeded
    const courseCheck = await client.query(`SELECT COUNT(*) FROM courses`);
    const count = parseInt(courseCheck.rows[0].count);

    if (count === 0) {
      console.log("Seeding courses and lessons...");
      for (const c of seedCourses) {
        const courseRes = await client.query(`
          INSERT INTO courses (id, title, level, students, rating, category, color, description, image_url, is_published)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
          RETURNING id
        `, [c.id, c.title, c.level, c.students, c.rating, c.category, c.color, c.description, c.image_url]);
        
        const courseId = courseRes.rows[0].id;
        
        for (const l of c.lessons) {
          await client.query(`
            INSERT INTO lessons (id, course_id, title, subtitle, estimated_time, instructions, initial_code, language, test_cases, solution_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [l.id, courseId, l.title, l.subtitle, l.estimatedTime, l.instructions, l.initialCode, l.language, JSON.stringify(l.testCases), l.solutionCode]);
          
          // Seed dynamic blocks for the lesson
          for (let i = 0; i < l.blocks.length; i++) {
            const block = l.blocks[i];
            await client.query(`
              INSERT INTO lesson_blocks (lesson_id, type, order_index, content)
              VALUES ($1, $2, $3, $4)
            `, [l.id, block.type, i, JSON.stringify(block.content)]);
          }
        }
      }
      console.log("Courses and lessons seeded.");
    } else {
      console.log("Courses already exist in the database, skipping seed.");
    }

    // Check and seed default users
    const userCheck = await client.query(`SELECT COUNT(*) FROM users`);
    const userCount = parseInt(userCheck.rows[0].count);
    if (userCount === 0) {
      console.log("Seeding default user, teacher, and admin accounts...");
      
      const salt = await bcrypt.genSalt(10);
      const studentPassword = await bcrypt.hash('password123', salt);
      const teacherPassword = await bcrypt.hash('password123', salt);
      const adminPassword = await bcrypt.hash('password123', salt);

      // Student Account
      const studentRes = await client.query(`
        INSERT INTO users (name, email, password_hash, role, location, bio, joined_date, study_time_seconds, has_completed_onboarding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        "Alex Rivera", 
        "alex@codeai.com", 
        studentPassword, 
        "user", 
        "San Francisco, CA", 
        "Full-stack developer leveling up my programming logic with AI guidance.", 
        "May 2026",
        4320, // 1.2 hrs in seconds
        true
      ]);
      const studentId = studentRes.rows[0].id;

      // Teacher Account
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, location, bio, joined_date, study_time_seconds, has_completed_onboarding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        "Professor Vance", 
        "teacher@codeai.com", 
        teacherPassword, 
        "teacher", 
        "Cambridge, MA", 
        "Computer Science Professor and developer helper.", 
        "May 2026",
        9000,
        true
      ]);

      // Admin Account
      const adminRes = await client.query(`
        INSERT INTO users (name, email, password_hash, role, location, bio, joined_date, study_time_seconds, has_completed_onboarding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        "Admin Chief", 
        "admin@codeai.com", 
        adminPassword, 
        "admin", 
        "Nur-Sultan, KZ", 
        "CodeAI System Administrator.", 
        "May 2026",
        18000,
        true
      ]);
      const adminId = adminRes.rows[0].id;
      
      console.log("Default accounts created:");
      console.log("- Student: alex@codeai.com / password123");
      console.log("- Teacher: teacher@codeai.com / password123");
      console.log("- Admin: admin@codeai.com / password123");

      // Seed Notifications
      console.log("Seeding sample notifications...");
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, link, is_read)
        VALUES 
        ($1, 'Welcome to CodeAI!', 'Start your journey by exploring our interactive courses!', 'info', '/courses', false),
        ($1, 'System Maintenance', 'The platform will undergo scheduled maintenance on June 15th.', 'warning', null, false)
      `, [studentId]);

      // Seed Admin Log
      console.log("Seeding sample admin logs...");
      await client.query(`
        INSERT INTO admin_logs (admin_id, admin_name, action)
        VALUES 
        ($1, 'Admin Chief', 'Initialized system and seeded default courses')
      `, [adminId]);
      
      console.log("Default accounts created:");
      console.log("- Student: alex@codeai.com / password123");
      console.log("- Teacher: teacher@codeai.com / password123");
    } else {
      console.log("Users already exist, skipping user seed.");
    }

    // Adjust sequences for courses if needed (since we manually inserted serial IDs 1, 2, 3)
    await client.query(`SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id)+1 FROM courses), 1), false)`);

    console.log("Database initialization finished successfully!");
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
