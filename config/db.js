require("dotenv").config({ override: true });

const mysql = require("mysql2");

console.log("db.js 실행됨");

const db = mysql.createConnection({
  host: process.env.DB_HOST?.trim() || "localhost",
  user: process.env.DB_USER?.trim() || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME?.trim() || "PillMate_2026",
  port: Number(process.env.DB_PORT || 3306),
});

db.connect((err) => {
  if (err) {
    console.log("DB 연결 실패");
    console.log(err);
  } else {
    console.log("DB 연결 성공");
  }
});

module.exports = db;
