const bcrypt = require("bcrypt");
const db = require("../config/db");

// 로그인 페이지
exports.renderLoginPage = (req, res) => {
  res.render("users/login");
};

// 회원가입 페이지
exports.renderSignupPage = (req, res) => {
  res.render("users/signup");
};

// 마이페이지
exports.renderMyPage = (req, res) => {
  res.render("users/mypage", {
    user: req.user,
  });
};

// 회원가입 처리
exports.signup = async (req, res) => {
  const {
    email,
    password,
    passwordConfirm,
    name,
    gender,
    birth_year,
    birth_month,
    birth_day,
  } = req.body;

  if (password !== passwordConfirm) {
    return res.send("비밀번호가 일치하지 않습니다.");
  }

  const birth_date = `${birth_year}-${birth_month}-${birth_day}`;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO \`USER\`
      (
        email,
        password,
        name,
        gender,
        birth_date,
        provider
      )
      VALUES (?, ?, ?, ?, ?, 'local')
    `;

    db.query(
      query,
      [email, hashedPassword, name, gender, birth_date],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.send("회원가입 실패");
        }

        res.redirect("/auth/login");
      }
    );
  } catch (err) {
    console.log(err);
    res.send("에러 발생");
  }
};

// 일반 로그인 처리
exports.login = (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM `USER` WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.log(err);
      return res.send("로그인 실패");
    }

    if (results.length === 0) {
      return res.send("존재하지 않는 이메일입니다.");
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send("비밀번호가 틀렸습니다.");
    }

    req.login(user, (err) => {
      if (err) {
        console.log(err);
        return res.send("로그인 실패");
      }

      return res.redirect("/auth/mypage");
    });rs
  });
};