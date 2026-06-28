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

// Seed data based on src/data/coursesData.js
const seedCourses = [
  {
    id: 1,
    title: "Python: Zero to Hero",
    level: "Beginner",
    students: "0",
    rating: 0.0,
    category: "Python",
    color: "#3776ab",
    description: "desc_python",
    image_url: "/assets/python.png",
    lessons: [
      {
        id: "py-1",
        title: "Introduction to Functions",
        subtitle: "Lesson 1.1",
        estimatedTime: "10 mins",
        instructions: "Functions are reusable blocks of code. In this lesson, you will write a function named `welcome_user(name)` that takes a name as a parameter and **prints** a greeting: `Hello, [name]!`. Note the exact punctuation: a comma after Hello, a space, and an exclamation mark at the end.",
        initialCode: `# Define a function welcome_user that greets the student\ndef welcome_user(name):\n    # TODO: Print greeting\n    pass\n\n# Test your function\nwelcome_user("Student")`,
        language: "python",
        testCases: [
          { input: ["Alice"], expected: "Hello, Alice!", type: "stdout", functionName: "welcome_user" },
          { input: ["Charlie"], expected: "Hello, Charlie!", type: "stdout", functionName: "welcome_user" }
        ],
        solutionCode: `def welcome_user(name):\n    print("Hello, " + name + "!")`
      },
      {
        id: "py-2",
        title: "Variables and Math",
        subtitle: "Lesson 1.2",
        estimatedTime: "15 mins",
        instructions: "Let's perform calculations using variables. Complete the function `circle_area(radius)` which calculates and **returns** the area of a circle. Use `3.14` as the value of Pi. The formula is `Area = 3.14 * (radius ** 2)`. Make sure to use `return` instead of printing.",
        initialCode: `# Calculate the area of a circle\ndef circle_area(radius):\n    # TODO: Calculate and return area using Pi = 3.14\n    pass`,
        language: "python",
        testCases: [
          { input: [5], expected: 78.5, type: "return", functionName: "circle_area" },
          { input: [10], expected: 314.0, type: "return", functionName: "circle_area" }
        ],
        solutionCode: `def circle_area(radius):\n    return 3.14 * (radius ** 2)`
      },
      {
        id: "py-3",
        title: "Filtering Lists with Loops",
        subtitle: "Lesson 1.3",
        estimatedTime: "20 mins",
        instructions: "Loops let us iterate over lists of data. Complete the function `get_evens(numbers)` which takes a list of integers and **returns** a new list containing only the even integers in their original order. An integer is even if dividing it by 2 leaves a remainder of 0 (`num % 2 == 0`).",
        initialCode: `# Return a list of even integers\ndef get_evens(numbers):\n    # TODO: Filter and return even numbers\n    pass`,
        language: "python",
        testCases: [
          { input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6], type: "return", functionName: "get_evens" },
          { input: [[15, 22, 9, 44, 100]], expected: [22, 44, 100], type: "return", functionName: "get_evens" }
        ],
        solutionCode: `def get_evens(numbers):\n    evens = []\n    for num in numbers:\n        if num % 2 == 0:\n            evens.append(num)\n    return evens`
      }
    ]
  },
  {
    id: 2,
    title: "Modern JavaScript Masterclass",
    level: "Intermediate",
    students: "0",
    rating: 0.0,
    category: "JavaScript",
    color: "#f7df1e",
    description: "desc_js",
    image_url: "/assets/js.png",
    lessons: [
      {
        id: "js-1",
        title: "Array Filtering",
        subtitle: "Lesson 2.1",
        estimatedTime: "12 mins",
        instructions: "JavaScript arrays provide clean utility methods like `.filter()`. Complete the function `filterNumbers(arr)` that takes an array of numbers and **returns** a new array containing only numbers greater than or equal to 10.",
        initialCode: `// Return numbers greater than or equal to 10\nfunction filterNumbers(arr) {\n    // TODO: Write code here\n    \n}`,
        language: "javascript",
        testCases: [
          { input: [[5, 12, 8, 130, 44]], expected: [12, 130, 44], type: "return", functionName: "filterNumbers" },
          { input: [[1, 2, 9]], expected: [], type: "return", functionName: "filterNumbers" }
        ],
        solutionCode: `function filterNumbers(arr) {\n    return arr.filter(num => num >= 10);\n}`
      },
      {
        id: "js-2",
        title: "Object Destructuring",
        subtitle: "Lesson 2.2",
        estimatedTime: "15 mins",
        instructions: "Destructuring lets us unpack fields from objects easily. Complete the function `formatUser(user)` which receives a user object (with fields `name`, `age`, and `role`) and **returns** a string in the format: `[name] is a [age] year old [role]`. Use ES6 template literals or string concatenation.",
        initialCode: `// Destructure the user object and format a descriptive string\nfunction formatUser(user) {\n    // TODO: Write code here\n    \n}`,
        language: "javascript",
        testCases: [
          { input: [{ name: "Alex", age: 24, role: "Developer" }], expected: "Alex is a 24 year old Developer", type: "return", functionName: "formatUser" },
          { input: [{ name: "Maria", age: 31, role: "Lead Architect" }], expected: "Maria is a 31 year old Lead Architect", type: "return", functionName: "formatUser" }
        ],
        solutionCode: `function formatUser(user) {\n    const { name, age, role } = user;\n    return \`\${name} is a \${age} year old \${role}\`;\n}`
      }
    ]
  },
  {
    id: 3,
    title: "Full-stack Web Dev: React & Node",
    level: "Advanced",
    students: "0",
    rating: 0.0,
    category: "Web Dev",
    color: "#61dafb",
    description: "desc_web",
    image_url: "/assets/reactjs.png",
    lessons: [
      {
        id: "web-1",
        title: "URL Query String Builder",
        subtitle: "Lesson 3.1",
        estimatedTime: "15 mins",
        instructions: "Web applications frequently construct URLs. Complete the function `buildQueryString(params)` that takes a parameter object (e.g. `{ search: \"react\", page: 2 }`) and **returns** a URL query string (e.g. `search=react&page=2`). If the parameters object is empty, return an empty string. Key-value pairs should be joined with `&`.",
        initialCode: `// Convert key-value parameters into a query string query\nfunction buildQueryString(params) {\n    // TODO: Write code here\n    \n}`,
        language: "javascript",
        testCases: [
          { input: [{ search: "react", page: 2 }], expected: "search=react&page=2", type: "return", functionName: "buildQueryString" },
          { input: [{}], expected: "", type: "return", functionName: "buildQueryString" }
        ],
        solutionCode: `function buildQueryString(params) {\n    return Object.entries(params)\n        .map(([key, val]) => \`\${key}=\${val}\`)\n        .join('&');\n}`
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
          INSERT INTO courses (id, title, level, students, rating, category, color, description, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [c.id, c.title, c.level, c.students, c.rating, c.category, c.color, c.description, c.image_url]);
        
        const courseId = courseRes.rows[0].id;
        
        for (const l of c.lessons) {
          await client.query(`
            INSERT INTO lessons (id, course_id, title, subtitle, estimated_time, instructions, initial_code, language, test_cases, solution_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [l.id, courseId, l.title, l.subtitle, l.estimatedTime, l.instructions, l.initialCode, l.language, JSON.stringify(l.testCases), l.solutionCode]);
          
          // Seed blocks for the lesson
          await client.query(`
            INSERT INTO lesson_blocks (lesson_id, type, order_index, content)
            VALUES ($1, $2, $3, $4)
          `, [l.id, 'theory', 0, JSON.stringify({
            title: l.title,
            body: `<p>Welcome to <strong>${l.title}</strong>!</p><p>Read the instructions and prepare for practice.</p>`
          })]);

          await client.query(`
            INSERT INTO lesson_blocks (lesson_id, type, order_index, content)
            VALUES ($1, $2, $3, $4)
          `, [l.id, 'practice', 1, JSON.stringify({
            instructions: l.instructions,
            initial_code: l.initialCode,
            solution_code: l.solutionCode,
            language: l.language,
            test_cases: l.testCases
          })]);
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
