import pg from 'pg';

const { Client } = pg;

async function fix() {
  const c = new Client({
    user: 'postgres',
    password: process.env.DB_PASSWORD || '1488',
    host: 'localhost',
    port: 5432,
    database: 'codeai'
  });

  try {
    await c.connect();
    
    const chs = [
      {id:1, title:'Переворот строки (Reverse a String)', description:'Напишите функцию на Python `reverse_string(s)`, которая принимает строку и возвращает её в перевернутом виде.'},
      {id:2, title:'Найти максимум (Find the Maximum)', description:'Напишите функцию на Python `find_max(lst)`, которая возвращает максимальное число из списка целых чисел.'},
      {id:3, title:'Проверка на палиндром (Check Palindrome)', description:'Напишите функцию на Python `is_palindrome(s)`, которая возвращает True, если строка является палиндромом, и False в противном случае.'},
      {id:4, title:'Числа Фибоначчи (Fibonacci Sequence)', description:'Напишите функцию на Python `fib(n)`, которая возвращает n-ое число Фибоначчи. (Например: fib(0) = 0, fib(1) = 1, fib(2) = 1, fib(3) = 2, fib(4) = 3).'},
      {id:5, title:'Сумма двух (Two Sum)', description:'Дан список целых чисел `nums` и целое число `target`. Напишите функцию `two_sum(nums, target)`, которая возвращает индексы двух чисел так, чтобы их сумма равнялась `target`. Вы можете вернуть список или кортеж из двух индексов.'}
    ];

    for(let ch of chs) {
      await c.query('UPDATE challenges SET title=$1, description=$2 WHERE id=$3', [ch.title, ch.description, ch.id]);
    }
    console.log('Restored DB to Russian');
  } catch(e) {
    console.error(e);
  } finally {
    await c.end();
  }
}

fix();
