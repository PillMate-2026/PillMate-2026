require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+09:00",
  dateStrings: true,
});

// 새 DB 연결이 생길 때마다 MySQL 세션 시간대를 한국시간으로 설정
pool.on("connection", (connection) => {
  connection.query("SET time_zone = '+09:00'");
});

module.exports = pool;
