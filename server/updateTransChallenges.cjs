const fs = require('fs');

const ruTasks = `
    challenge_1_title: "1-есеп: Сложение двух чисел",
    challenge_1_desc: "Напишите функцию \`add(a, b)\`, которая принимает два числа и возвращает их сумму.\\n\\n**Пример:**\\n\`\`\`python\\nadd(3, 4) # возвращает 7\\n\`\`\`",
    challenge_2_title: "2-есеп: Разворот строки",
    challenge_2_desc: "Напишите функцию \`reverse_string(s)\`, которая принимает строку и возвращает её в перевернутом виде.\\n\\n**Пример:**\\n\`\`\`python\\nreverse_string(\"hello\") # возвращает \"olleh\"\\n\`\`\`",
    challenge_3_title: "3-есеп: Четное или нечетное",
    challenge_3_desc: "Напишите функцию \`is_even(n)\`, которая возвращает \`True\`, если число четное, и \`False\`, если нечетное.\\n\\n**Пример:**\\n\`\`\`python\\nis_even(4) # True\\nis_even(7) # False\\n\`\`\`",
    challenge_4_title: "4-есеп: Максимум в массиве",
    challenge_4_desc: "Напишите функцию \`find_max(arr)\`, которая возвращает самое большое число из массива.\\n\\n**Пример:**\\n\`\`\`python\\nfind_max([1, 5, 3, 9, 2]) # возвращает 9\\n\`\`\`",
    challenge_5_title: "5-есеп: Вычисление факториала",
    challenge_5_desc: "Напишите функцию \`factorial(n)\`, которая возвращает факториал числа.\\n\\n**Пример:**\\n\`\`\`python\\nfactorial(5) # возвращает 120 (5 * 4 * 3 * 2 * 1)\\n\`\`\`",
`;

const kzTasks = `
    challenge_1_title: "1-есеп: Екі санды қосу",
    challenge_1_desc: "Берілген a және b екі санын қосатын \`add(a, b)\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\`\`\`python\\nadd(3, 4) # 7 қайтарады\\n\`\`\`",
    challenge_2_title: "2-есеп: Сөзді кері аудару",
    challenge_2_desc: "Берілген сөзді кері аударатын \`reverse_string(s)\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\`\`\`python\\nreverse_string(\"hello\") # \"olleh\" қайтарады\\n\`\`\`",
    challenge_3_title: "3-есеп: Жұп немесе тақ",
    challenge_3_desc: "Егер \`n\` саны жұп болса \`True\`, ал тақ болса \`False\` қайтаратын \`is_even(n)\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\`\`\`python\\nis_even(4) # True\\nis_even(7) # False\\n\`\`\`",
    challenge_4_title: "4-есеп: Массивтің ең үлкен элементі",
    challenge_4_desc: "Сандар массивіндегі ең үлкен мәнді қайтаратын \`find_max(arr)\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\`\`\`python\\nfind_max([1, 5, 3, 9, 2]) # 9 қайтарады\\n\`\`\`",
    challenge_5_title: "5-есеп: Факториалды есептеу",
    challenge_5_desc: "Берілген \`n\` санының факториалын есептейтін \`factorial(n)\` функциясын жазыңыз.\\n\\n**Мысал:**\\n\`\`\`python\\nfactorial(5) # 120 қайтарады (5 * 4 * 3 * 2 * 1)\\n\`\`\`",
`;

const enTasks = `
    challenge_1_title: "Task 1: Add Two Numbers",
    challenge_1_desc: "Write a function \`add(a, b)\` that takes two numbers and returns their sum.\\n\\n**Example:**\\n\`\`\`python\\nadd(3, 4) # returns 7\\n\`\`\`",
    challenge_2_title: "Task 2: Reverse a String",
    challenge_2_desc: "Write a function \`reverse_string(s)\` that takes a string and returns it reversed.\\n\\n**Example:**\\n\`\`\`python\\nreverse_string(\"hello\") # returns \"olleh\"\\n\`\`\`",
    challenge_3_title: "Task 3: Even or Odd",
    challenge_3_desc: "Write a function \`is_even(n)\` that returns \`True\` if the number is even, and \`False\` if odd.\\n\\n**Example:**\\n\`\`\`python\\nis_even(4) # True\\nis_even(7) # False\\n\`\`\`",
    challenge_4_title: "Task 4: Maximum in Array",
    challenge_4_desc: "Write a function \`find_max(arr)\` that returns the largest number in an array.\\n\\n**Example:**\\n\`\`\`python\\nfind_max([1, 5, 3, 9, 2]) # returns 9\\n\`\`\`",
    challenge_5_title: "Task 5: Calculate Factorial",
    challenge_5_desc: "Write a function \`factorial(n)\` that returns the factorial of a number.\\n\\n**Example:**\\n\`\`\`python\\nfactorial(5) # returns 120 (5 * 4 * 3 * 2 * 1)\\n\`\`\`",
`;

let content = fs.readFileSync('../src/utils/translations.js', 'utf8');

// Replace using a simple matching for the end of the objects
content = content.replace("profileMenuAdmin: \"Админ панель\",\r\n  }", "profileMenuAdmin: \"Админ панель\",\r\n" + ruTasks + "\r\n  }");
content = content.replace("profileMenuAdmin: \"Админ панель\",\n  }", "profileMenuAdmin: \"Админ панель\",\n" + ruTasks + "\n  }");

content = content.replace("profileMenuAdmin: \"Әкімші тақтасы\",\r\n  }", "profileMenuAdmin: \"Әкімші тақтасы\",\r\n" + kzTasks + "\r\n  }");
content = content.replace("profileMenuAdmin: \"Әкімші тақтасы\",\n  }", "profileMenuAdmin: \"Әкімші тақтасы\",\n" + kzTasks + "\n  }");

content = content.replace("profileMenuAdmin: \"Admin Dashboard\",\r\n  }", "profileMenuAdmin: \"Admin Dashboard\",\r\n" + enTasks + "\r\n  }");
content = content.replace("profileMenuAdmin: \"Admin Dashboard\",\n  }", "profileMenuAdmin: \"Admin Dashboard\",\n" + enTasks + "\n  }");

fs.writeFileSync('../src/utils/translations.js', content);
console.log("Done");
