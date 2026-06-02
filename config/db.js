const mysql = require("mysql2");

console.log("db.js 실행됨");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "PillMate_2026",
  port: process.env.DB_PORT || 3306,
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