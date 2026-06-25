const fs = require('fs');

const original = fs.readFileSync('../src/utils/translations.js', 'utf8');

let ruMatch = original.match(/ru:\s*\{([\s\S]*?)\},\s*kz:\s*\{/);
let ruStr = ruMatch ? ruMatch[1] : '';

const kzStart = original.indexOf('kz: {');
let kzStr = '';
let enStr = '';

if (kzStart !== -1) {
  const kzAdminIndex = original.indexOf('profileMenuAdmin: "Әкімші тақтасы"', kzStart);
  if (kzAdminIndex !== -1) {
    kzStr = original.substring(kzStart + 5, kzAdminIndex + 'profileMenuAdmin: "Әкімші тақтасы"'.length);
    
    const enStart = original.indexOf('profile: "Profile"', kzAdminIndex);
    if (enStart !== -1) {
        enStr = original.substring(enStart);
        const enAdminIndex = enStr.indexOf('profileMenuAdmin: "Admin Dashboard"');
        if (enAdminIndex !== -1) {
            enStr = enStr.substring(0, enAdminIndex + 'profileMenuAdmin: "Admin Dashboard"'.length);
        }
    }
  }
}

ruStr = ruStr.replace(/challenge_1_title[\s\S]*/, '').trim();
if (ruStr.endsWith(',')) ruStr = ruStr.slice(0, -1);

kzStr = kzStr.replace(/challenge_1_title[\s\S]*/, '').trim();
if (kzStr.endsWith(',')) kzStr = kzStr.slice(0, -1);

enStr = enStr.replace(/challenge_1_title[\s\S]*/, '').trim();
if (enStr.endsWith(',')) enStr = enStr.slice(0, -1);

const challengeRu = `
    challenge_1_title: "1-есеп: Сложение двух чисел",
    challenge_1_desc: "Напишите функцию \\`add(a, b)\\`, которая принимает два числа и возвращает их сумму.\\n\\n**Пример:**\\n\\`\\`\\`python\\nadd(3, 4) # возвращает 7\\n\\`\\`\\`",
    challenge_2_title: "2-есеп: Разворот строки",
    challenge_2_desc: "Напишите функцию \\`reverse_string(s)\\`, которая принимает строку и возвращает её в перевернутом виде.\\n\\n**Пример:**\\n\\`\\`\\`python\\nreverse_string(\\"hello\\") # возвращает \\"olleh\\"\\n\\`\\`\\`",
    challenge_3_title: "3-есеп: Четное или нечетное",
    challenge_3_desc: "Напишите функцию \\`is_even(n)\\`, которая возвращает \\`True\\`, если число четное, и \\`False\\`, если нечетное.\\n\\n**Пример:**\\n\\`\\`\\`python\\nis_even(4) # True\\nis_even(7) # False\\n\\`\\`\\`",
    challenge_4_title: "4-есеп: Максимум в массиве",
    challenge_4_desc: "Напишите функцию \\`find_max(arr)\\`, которая возвращает самое большое число из массива.\\n\\n**Пример:**\\n\\`\\`\\`python\\nfind_max([1, 5, 3, 9, 2]) # возвращает 9\\n\\`\\`\\`",
    challenge_5_title: "5-есеп: Вычисление факториала",
    challenge_5_desc: "Напишите функцию \\`factorial(n)\\`, которая возвращает факториал числа.\\n\\n**Пример:**\\n\\`\\`\\`python\\nfactorial(5) # возвращает 120 (5 * 4 * 3 * 2 * 1)\\n\\`\\`\\`"`;

const challengeKz = `
    challenge_1_title: "1-есеп: Екі санды қосу",
    challenge_1_desc: "Берілген a және b екі санын қосатын \\`add(a, b)\\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\\`\\`\\`python\\nadd(3, 4) # 7 қайтарады\\n\\`\\`\\`",
    challenge_2_title: "2-есеп: Сөзді кері аудару",
    challenge_2_desc: "Берілген сөзді кері аударатын \\`reverse_string(s)\\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\\`\\`\\`python\\nreverse_string(\\"hello\\") # \\"olleh\\" қайтарады\\n\\`\\`\\`",
    challenge_3_title: "3-есеп: Жұп немесе тақ",
    challenge_3_desc: "Егер \\`n\\` саны жұп болса \\`True\\`, ал тақ болса \\`False\\` қайтаратын \\`is_even(n)\\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\\`\\`\\`python\\nis_even(4) # True\\nis_even(7) # False\\n\\`\\`\\`",
    challenge_4_title: "4-есеп: Массивтің ең үлкен элементі",
    challenge_4_desc: "Сандар массивіндегі ең үлкен мәнді қайтаратын \\`find_max(arr)\\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\\`\\`\\`python\\nfind_max([1, 5, 3, 9, 2]) # 9 қайтарады\\n\\`\\`\\`",
    challenge_5_title: "5-есеп: Факториалды есептеу",
    challenge_5_desc: "Берілген \\`n\\` санының факториалын есептейтін \\`factorial(n)\\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\\`\\`\\`python\\nfactorial(5) # 120 қайтарады (5 * 4 * 3 * 2 * 1)\\n\\`\\`\\`"`;

const challengeEn = `
    challenge_1_title: "Task 1: Add Two Numbers",
    challenge_1_desc: "Write a function \\`add(a, b)\\` that takes two numbers and returns their sum.\\n\\n**Example:**\\n\\`\\`\\`python\\nadd(3, 4) # returns 7\\n\\`\\`\\`",
    challenge_2_title: "Task 2: Reverse a String",
    challenge_2_desc: "Write a function \\`reverse_string(s)\\` that takes a string and returns it reversed.\\n\\n**Example:**\\n\\`\\`\\`python\\nreverse_string(\\"hello\\") # returns \\"olleh\\"\\n\\`\\`\\`",
    challenge_3_title: "Task 3: Even or Odd",
    challenge_3_desc: "Write a function \\`is_even(n)\\` that returns \\`True\\` if the number is even, and \\`False\\` if odd.\\n\\n**Example:**\\n\\`\\`\\`python\\nis_even(4) # True\\nis_even(7) # False\\n\\`\\`\\`",
    challenge_4_title: "Task 4: Maximum in Array",
    challenge_4_desc: "Write a function \\`find_max(arr)\\` that returns the largest number in an array.\\n\\n**Example:**\\n\\`\\`\\`python\\nfind_max([1, 5, 3, 9, 2]) # returns 9\\n\\`\\`\\`",
    challenge_5_title: "Task 5: Calculate Factorial",
    challenge_5_desc: "Write a function \\`factorial(n)\\` that returns the factorial of a number.\\n\\n**Example:**\\n\\`\\`\\`python\\nfactorial(5) # returns 120 (5 * 4 * 3 * 2 * 1)\\n\\`\\`\\`"`;

let finalFile = 'export const translations = {\\n  ru: {\\n' +
ruStr + ',\\n' + challengeRu + '\\n  },\\n  kz: {\\n' +
kzStr + ',\\n' + challengeKz + '\\n  },\\n  en: {\\n    // Navigation\\n    dashboard: "Dashboard",\\n    courses: "Courses",\\n' +
enStr + ',\\n' + challengeEn + '\\n  }\\n};\\n';

fs.writeFileSync('../src/utils/translations.js', finalFile);
console.log('Fixed translations.js');
