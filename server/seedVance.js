import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function seed() {
  const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: 'postgres',
        password: process.env.DB_PASSWORD || '1488',
        host: 'localhost',
        port: 5432,
        database: 'codeai'
      };

  const client = new Client(dbConfig);

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
        title: 'Удвоение чисел (Double Numbers)',
        slug: 'double-numbers',
        difficulty: 'easy',
        description: 'Напишите функцию на JavaScript `doubleNumbers(arr)`, которая принимает массив чисел и возвращает новый массив, в котором каждое число умножено на 2.',
        test_cases: JSON.stringify([
          { input: [[1, 2, 3]], expected: [2, 4, 6], type: "return", functionName: "doubleNumbers" },
          { input: [[10, 20]], expected: [20, 40], type: "return", functionName: "doubleNumbers" }
        ])
      },
      {
        title: 'Четные числа (Filter Evens)',
        slug: 'filter-evens',
        difficulty: 'easy',
        description: 'Напишите функцию `filterEvens(arr)`, которая возвращает массив только с четными числами.',
        test_cases: JSON.stringify([
          { input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6], type: "return", functionName: "filterEvens" },
          { input: [[11, 22, 33]], expected: [22], type: "return", functionName: "filterEvens" }
        ])
      },
      {
        title: 'Самое длинное слово (Longest Word)',
        slug: 'longest-word',
        difficulty: 'medium',
        description: 'Напишите функцию `longestWord(str)`, которая принимает строку из слов, разделенных пробелами, и возвращает самое длинное слово.',
        test_cases: JSON.stringify([
          { input: ["The quick brown fox jumped over the lazy dog"], expected: "jumped", type: "return", functionName: "longestWord" },
          { input: ["May the force be with you"], expected: "force", type: "return", functionName: "longestWord" }
        ])
      },
      {
        title: 'Подсчет гласных (Count Vowels)',
        slug: 'count-vowels',
        difficulty: 'medium',
        description: 'Напишите функцию `countVowels(str)`, которая возвращает количество гласных (a, e, i, o, u) в переданной строке. Строка может быть в любом регистре.',
        test_cases: JSON.stringify([
          { input: ["hello"], expected: 2, type: "return", functionName: "countVowels" },
          { input: ["javascript is awesome"], expected: 8, type: "return", functionName: "countVowels" }
        ])
      },
      {
        title: 'Анаграммы (Valid Anagram)',
        slug: 'valid-anagram',
        difficulty: 'hard',
        description: 'Напишите функцию `isValidAnagram(str1, str2)`, которая проверяет, являются ли две строки анаграммами друг друга. Верните `true` или `false`.',
        test_cases: JSON.stringify([
          { input: ["listen", "silent"], expected: true, type: "return", functionName: "isValidAnagram" },
          { input: ["hello", "world"], expected: false, type: "return", functionName: "isValidAnagram" }
        ])
      }
    ];

    for (const ch of challenges) {
      await client.query(
        "INSERT INTO challenges (title, slug, difficulty, description, test_cases, created_by, is_published) VALUES ($1, $2, $3, $4, $5, $6, true) ON CONFLICT DO NOTHING",
        [ch.title, ch.slug, ch.difficulty, ch.description, ch.test_cases, vanceId]
      );
    }
    console.log('Inserted 5 challenges');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

seed();
