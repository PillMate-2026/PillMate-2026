const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "PillMate_2026",
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