require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  await conn.query(sql);

  const [rows] = await conn.query('SELECT COUNT(*) AS cnt FROM MEDICINE_WASTE_BIN');
  console.log('삽입된 수거함 수:', rows[0].cnt);

  await conn.end();
})().catch(e => {
  console.error('seed 실패:', e.message);
  process.exit(1);
});
