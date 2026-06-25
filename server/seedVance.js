import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function seed() {
  const client = new Client({
    user: 'postgres',
    password: process.env.DB_PASSWORD || '1488',
    host: 'localhost',
    port: 5432,
    database: 'codeai'
  });

  try {
    await client.connect();
    
    // Create Professor Vance if not exists
    let res = await client.query("SELECT id FROM users WHERE email = $1", ['vance@codeai.com']);
    let vanceId;
    if (res.rows.length === 0) {
      const hash = await bcrypt.hash('password123', 10);
      const insertRes = await client.query(
        "INSERT INTO users (name, email, password_hash, role, joined_date) VALUES ($1, $2, $3, $4, '2026-06-23') RETURNING id",
        ['Professor Vance', 'vance@codeai.com', hash, 'teacher']
      );
      vanceId = insertRes.rows[0].id;
      console.log('Created Professor Vance with ID:', vanceId);
    } else {
      vanceId = res.rows[0].id;
      console.log('Found Professor Vance with ID:', vanceId);
    }

    // Insert 5 challenges
    const challenges = [
      {
        title: 'Переворот строки (Reverse a String)',
        slug: 'reverse-string',
        difficulty: 'easy',
        description: 'Напишите функцию на Python `reverse_string(s)`, которая принимает строку и возвращает её в перевернутом виде.',
        test_cases: JSON.stringify([{ stdin: '["hello"]', expected_stdout: '"olleh"' }, { stdin: '["world"]', expected_stdout: '"dlrow"' }])
      },
      {
        title: 'Найти максимум (Find the Maximum)',
        slug: 'find-maximum',
        difficulty: 'easy',
        description: 'Напишите функцию на Python `find_max(lst)`, которая возвращает максимальное число из списка целых чисел.',
        test_cases: JSON.stringify([{ stdin: '[[1, 5, 2, 9, 3]]', expected_stdout: '9' }])
      },
      {
        title: 'Проверка на палиндром (Check Palindrome)',
        slug: 'check-palindrome',
        difficulty: 'medium',
        description: 'Напишите функцию на Python `is_palindrome(s)`, которая возвращает True, если строка является палиндромом, и False в противном случае.',
        test_cases: JSON.stringify([{ stdin: '["racecar"]', expected_stdout: 'True' }, { stdin: '["hello"]', expected_stdout: 'False' }])
      },
      {
        title: 'Числа Фибоначчи (Fibonacci Sequence)',
        slug: 'fibonacci',
        difficulty: 'medium',
        description: 'Напишите функцию на Python `fib(n)`, которая возвращает n-ое число Фибоначчи. (Например: fib(0) = 0, fib(1) = 1, fib(2) = 1, fib(3) = 2, fib(4) = 3).',
        test_cases: JSON.stringify([{ stdin: '[5]', expected_stdout: '5' }, { stdin: '[10]', expected_stdout: '55' }])
      },
      {
        title: 'Сумма двух (Two Sum)',
        slug: 'two-sum',
        difficulty: 'hard',
        description: 'Дан список целых чисел `nums` и целое число `target`. Напишите функцию `two_sum(nums, target)`, которая возвращает индексы двух чисел так, чтобы их сумма равнялась `target`. Вы можете вернуть список или кортеж из двух индексов.',
        test_cases: JSON.stringify([{ stdin: '[[2, 7, 11, 15], 9]', expected_stdout: '[0, 1]' }])
      }
    ];

    for (const ch of challenges) {
      await client.query(
        "INSERT INTO challenges (title, slug, difficulty, description, test_cases, created_by, is_published) VALUES ($1, $2, $3, $4, $5, $6, true) ON CONFLICT DO NOTHING",
        [ch.title, ch.slug, ch.difficulty, ch.description, ch.test_cases, vanceId]
      );
    }
    console.log('Inserted 5 challenges');

    // Insert 1 course
    const courseRes = await client.query(
      "INSERT INTO courses (title, description, level, category, color, created_by, is_published) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id",
      ['Python Mini-Course', 'A quick dive into Python fundamentals', 'Beginner', 'Python', '#3776ab', vanceId]
    );
    const courseId = courseRes.rows[0].id;
    console.log('Inserted course with ID:', courseId);

    // Insert 3 lessons
    const lessons = [
      { id: 'vance-py-1', title: 'Data Types', subtitle: 'Lesson 1', estimated_time: '5 mins', language: 'python' },
      { id: 'vance-py-2', title: 'Control Flow', subtitle: 'Lesson 2', estimated_time: '10 mins', language: 'python' },
      { id: 'vance-py-3', title: 'Functions', subtitle: 'Lesson 3', estimated_time: '15 mins', language: 'python' }
    ];

    let orderIndex = 0;
    for (const l of lessons) {
      await client.query(
        "INSERT INTO lessons (id, course_id, title, subtitle, estimated_time, instructions, initial_code, language, test_cases, solution_code, order_index) VALUES ($1, $2, $3, $4, $5, '', '', $6, $7, '', $8)",
        [l.id, courseId, l.title, l.subtitle, l.estimated_time, l.language, JSON.stringify([]), orderIndex]
      );
      
      // Add a simple theory block to each lesson
      await client.query(
        "INSERT INTO lesson_blocks (lesson_id, type, order_index, content) VALUES ($1, $2, $3, $4)",
        [l.id, 'theory', 0, JSON.stringify({ body: 'Welcome to ' + l.title + '! Here you will learn about ' + l.title + '.' })]
      );
      orderIndex++;
    }
    console.log('Inserted 3 lessons with content');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

seed();
