import pg from 'pg';

const { Client } = pg;

async function rename() {
  const client = new Client({
    user: 'postgres',
    password: process.env.DB_PASSWORD || '1488',
    host: 'localhost',
    port: 5432,
    database: 'codeai'
  });

  try {
    await client.connect();
    
    const res = await client.query(
      "UPDATE users SET name = $1 WHERE email = $2 RETURNING id",
      ['Koko Jambo', 'vance@codeai.com']
    );
    
    if (res.rows.length > 0) {
      console.log('Renamed successfully to Koko Jambo!');
    } else {
      console.log('User not found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

rename();
