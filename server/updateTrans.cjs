const fs = require('fs');
let content = fs.readFileSync('../src/utils/translations.js', 'utf8');

const newRu = `
    diffEasy: "Легкая",
    diffMedium: "Средняя",
    diffHard: "Сложная",
    languageDesc: "Измените язык интерфейса по умолчанию",
    themeDesc: "Измените тему оформления платформы",
    invalidCredentials: "Неверный email или пароль",
    userNotFound: "Пользователь не найден",
    emailInUse: "Этот email уже используется",
    serverError: "Ошибка сервера. Попробуйте позже.",
    activityHistory: "История активности",
    profileMenuProfile: "Мой профиль",
    profileMenuSettings: "Настройки",
    profileMenuLogout: "Выйти",
    profileMenuAdmin: "Админ панель",
`;

const newKz = `
    diffEasy: "Оңай",
    diffMedium: "Орташа",
    diffHard: "Күрделі",
    languageDesc: "Әдепкі интерфейс тілін өзгерту",
    themeDesc: "Платформаның безендіру тақырыбын өзгерту",
    invalidCredentials: "Қате email немесе құпия сөз",
    userNotFound: "Пайдаланушы табылмады",
    emailInUse: "Бұл email қазірдің өзінде қолданыста",
    serverError: "Сервер қатесі. Кейінірек қайталаңыз.",
    activityHistory: "Белсенділік тарихы",
    profileMenuProfile: "Менің профилім",
    profileMenuSettings: "Реттеулер",
    profileMenuLogout: "Шығу",
    profileMenuAdmin: "Әкімші тақтасы",
`;

const newEn = `
    diffEasy: "Easy",
    diffMedium: "Medium",
    diffHard: "Hard",
    languageDesc: "Change the default interface language",
    themeDesc: "Change the platform appearance theme",
    invalidCredentials: "Invalid email or password",
    userNotFound: "User not found",
    emailInUse: "Email is already in use",
    serverError: "Server error. Please try again later.",
    activityHistory: "Activity History",
    profileMenuProfile: "My Profile",
    profileMenuSettings: "Settings",
    profileMenuLogout: "Logout",
    profileMenuAdmin: "Admin Dashboard",
`;

content = content.replace('min: "мин",\r\n    hoursShort: "ч"\r\n  }', 'min: "мин",\r\n    hoursShort: "ч",' + newRu + '\r\n  }');
content = content.replace('min: "мин",\r\n    hoursShort: "сағ"\r\n  }', 'min: "мин",\r\n    hoursShort: "сағ",' + newKz + '\r\n  }');
content = content.replace('min: "m",\r\n    hoursShort: "h"\r\n  }', 'min: "m",\r\n    hoursShort: "h",' + newEn + '\r\n  }');

// If CRLF wasn't found, try LF
content = content.replace('min: "мин",\n    hoursShort: "ч"\n  }', 'min: "мин",\n    hoursShort: "ч",' + newRu + '\n  }');
content = content.replace('min: "мин",\n    hoursShort: "сағ"\n  }', 'min: "мин",\n    hoursShort: "сағ",' + newKz + '\n  }');
content = content.replace('min: "m",\n    hoursShort: "h"\n  }', 'min: "m",\n    hoursShort: "h",' + newEn + '\n  }');

fs.writeFileSync('../src/utils/translations.js', content);
console.log('Done');
