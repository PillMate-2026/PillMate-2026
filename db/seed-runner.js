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

  const seedFiles = [
    'seed_waste_bins.sql',
    'seed_chatbot.sql'
  ];

  for (const file of seedFiles) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await conn.query(sql);
    console.log(`${file} 실행 완료`);
  }

  const [binRows] = await conn.query('SELECT COUNT(*) AS cnt FROM MEDICINE_WASTE_BIN');
  console.log('삽입된 수거함 수:', binRows[0].cnt);

  const [symptomRows] = await conn.query('SELECT COUNT(*) AS cnt FROM SYMPTOM');
  console.log('삽입된 증상 수:', symptomRows[0].cnt);

  const [mappingRows] = await conn.query('SELECT COUNT(*) AS cnt FROM INGREDIENT_SYMPTOM');
  console.log('삽입된 성분-증상 매핑 수:', mappingRows[0].cnt);

  await conn.end();
})().catch(e => {
  console.error('seed 실패:', e.message);
  process.exit(1);
});
