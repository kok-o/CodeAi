import re

with open('../src/utils/translations.js', 'r', encoding='utf-8') as f:
    original = f.read()

ru_match = re.search(r'ru:\s*\{([\s\S]*?)\},\s*kz:\s*\{', original)
ru_str = ru_match.group(1) if ru_match else ''

kz_start = original.find('kz: {')
kz_str = ''
en_str = ''

if kz_start != -1:
    kz_admin_idx = original.find('profileMenuAdmin: "Әкімші тақтасы"', kz_start)
    if kz_admin_idx != -1:
        kz_str = original[kz_start + 5: kz_admin_idx + len('profileMenuAdmin: "Әкімші тақтасы"')]
        
        en_start = original.find('profile: "Profile"', kz_admin_idx)
        if en_start != -1:
            en_str = original[en_start:]
            en_admin_idx = en_str.find('profileMenuAdmin: "Admin Dashboard"')
            if en_admin_idx != -1:
                en_str = en_str[:en_admin_idx + len('profileMenuAdmin: "Admin Dashboard"')]

# remove old challenges if any
ru_str = re.sub(r'challenge_1_title[\s\S]*', '', ru_str).strip()
if ru_str.endswith(','): ru_str = ru_str[:-1]

kz_str = re.sub(r'challenge_1_title[\s\S]*', '', kz_str).strip()
if kz_str.endswith(','): kz_str = kz_str[:-1]

en_str = re.sub(r'challenge_1_title[\s\S]*', '', en_str).strip()
if en_str.endswith(','): en_str = en_str[:-1]

challenge_ru = """
    challenge_1_title: "1-есеп: Сложение двух чисел",
    challenge_1_desc: "Напишите функцию `add(a, b)`, которая принимает два числа и возвращает их сумму.\\n\\n**Пример:**\\n```python\\nadd(3, 4) # возвращает 7\\n```",
    challenge_2_title: "2-есеп: Разворот строки",
    challenge_2_desc: "Напишите функцию `reverse_string(s)`, которая принимает строку и возвращает её в перевернутом виде.\\n\\n**Пример:**\\n```python\\nreverse_string(\\"hello\\") # возвращает \\"olleh\\"\\n```",
    challenge_3_title: "3-есеп: Четное или нечетное",
    challenge_3_desc: "Напишите функцию `is_even(n)`, которая возвращает `True`, если число четное, и `False`, если нечетное.\\n\\n**Пример:**\\n```python\\nis_even(4) # True\\nis_even(7) # False\\n```",
    challenge_4_title: "4-есеп: Максимум в массиве",
    challenge_4_desc: "Напишите функцию `find_max(arr)`, которая возвращает самое большое число из массива.\\n\\n**Пример:**\\n```python\\nfind_max([1, 5, 3, 9, 2]) # возвращает 9\\n```",
    challenge_5_title: "5-есеп: Вычисление факториала",
    challenge_5_desc: "Напишите функцию `factorial(n)`, которая возвращает факториал числа.\\n\\n**Пример:**\\n```python\\nfactorial(5) # возвращает 120 (5 * 4 * 3 * 2 * 1)\\n```"
"""

challenge_kz = """
    challenge_1_title: "1-есеп: Екі санды қосу",
    challenge_1_desc: "Берілген a және b екі санын қосатын `add(a, b)` функциясын жазыңыз.\\n\\n**Мысал:**\\n```python\\nadd(3, 4) # 7 қайтарады\\n```",
    challenge_2_title: "2-есеп: Сөзді кері аудару",
    challenge_2_desc: "Берілген сөзді кері аударатын `reverse_string(s)` функциясын жазыңыз.\\n\\n**Мысал:**\\n```python\\nreverse_string(\\"hello\\") # \\"olleh\\" қайтарады\\n```",
    challenge_3_title: "3-есеп: Жұп немесе тақ",
    challenge_3_desc: "Егер `n` саны жұп болса `True`, ал тақ болса `False` қайтаратын `is_even(n)` функциясын жазыңыз.\\n\\n**Мысал:**\\n```python\\nis_even(4) # True\\nis_even(7) # False\\n```",
    challenge_4_title: "4-есеп: Массивтің ең үлкен элементі",
    challenge_4_desc: "Сандар массивіндегі ең үлкен мәнді қайтаратын `find_max(arr)` функциясын жазыңыз.\\n\\n**Мысал:**\\n```python\\nfind_max([1, 5, 3, 9, 2]) # 9 қайтарады\\n```",
    challenge_5_title: "5-есеп: Факториалды есептеу",
    challenge_5_desc: "Берілген `n` санының факториалын есептейтін `factorial(n)` функциясын жазыңыз.\\n\\n**Мысал:**\\n```python\\nfactorial(5) # 120 қайтарады (5 * 4 * 3 * 2 * 1)\\n```"
"""

challenge_en = """
    challenge_1_title: "Task 1: Add Two Numbers",
    challenge_1_desc: "Write a function `add(a, b)` that takes two numbers and returns their sum.\\n\\n**Example:**\\n```python\\nadd(3, 4) # returns 7\\n```",
    challenge_2_title: "Task 2: Reverse a String",
    challenge_2_desc: "Write a function `reverse_string(s)` that takes a string and returns it reversed.\\n\\n**Example:**\\n```python\\nreverse_string(\\"hello\\") # returns \\"olleh\\"\\n```",
    challenge_3_title: "Task 3: Even or Odd",
    challenge_3_desc: "Write a function `is_even(n)` that returns `True` if the number is even, and `False` if odd.\\n\\n**Example:**\\n```python\\nis_even(4) # True\\nis_even(7) # False\\n```",
    challenge_4_title: "Task 4: Maximum in Array",
    challenge_4_desc: "Write a function `find_max(arr)` that returns the largest number in an array.\\n\\n**Example:**\\n```python\\nfind_max([1, 5, 3, 9, 2]) # returns 9\\n```",
    challenge_5_title: "Task 5: Calculate Factorial",
    challenge_5_desc: "Write a function `factorial(n)` that returns the factorial of a number.\\n\\n**Example:**\\n```python\\nfactorial(5) # returns 120 (5 * 4 * 3 * 2 * 1)\\n```"
"""

final_file = f"""export const translations = {{
  ru: {{
{ru_str},
{challenge_ru.strip()}
  }},
  kz: {{
{kz_str},
{challenge_kz.strip()}
  }},
  en: {{
    // Navigation
    dashboard: "Dashboard",
    courses: "Courses",
{en_str},
{challenge_en.strip()}
  }}
}};
"""

with open('../src/utils/translations.js', 'w', encoding='utf-8') as f:
    f.write(final_file)

print("Fixed translations.js successfully.")
