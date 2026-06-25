import pool from './db.js';

const translations = {
  1: {
    title: "1-есеп: Екі санды қосу",
    description: "Берілген a және b екі санын қосатын `add(a, b)` функциясын жазыңыз.\n\n**Мысал:**\n```python\nadd(3, 4) # 7 қайтарады\n```",
  },
  2: {
    title: "2-есеп: Сөзді кері аудару",
    description: "Берілген сөзді кері аударатын `reverse_string(s)` функциясын жазыңыз.\n\n**Мысал:**\n```python\nreverse_string(\"hello\") # \"olleh\" қайтарады\n```",
  },
  3: {
    title: "3-есеп: Жұп немесе тақ",
    description: "Егер `n` саны жұп болса `True`, ал тақ болса `False` қайтаратын `is_even(n)` функциясын жазыңыз.\n\n**Мысал:**\n```python\nis_even(4) # True\nis_even(7) # False\n```",
  },
  4: {
    title: "4-есеп: Массивтің ең үлкен элементі",
    description: "Сандар массивіндегі ең үлкен мәнді қайтаратын `find_max(arr)` функциясын жазыңыз.\n\n**Мысал:**\n```python\nfind_max([1, 5, 3, 9, 2]) # 9 қайтарады\n```",
  },
  5: {
    title: "5-есеп: Факториалды есептеу",
    description: "Берілген `n` санының факториалын есептейтін `factorial(n)` функциясын жазыңыз.\n\n**Мысал:**\n```python\nfactorial(5) # 120 қайтарады (5 * 4 * 3 * 2 * 1)\n```",
  }
};

async function translateChallenges() {
  for (const [id, data] of Object.entries(translations)) {
    try {
      await pool.query('UPDATE challenges SET title = $1, description = $2 WHERE id = $3', [data.title, data.description, id]);
      console.log(`Translated challenge ${id}`);
    } catch (err) {
      console.error(`Error translating ${id}:`, err.message);
    }
  }
  console.log('All done.');
  process.exit(0);
}

translateChallenges();
