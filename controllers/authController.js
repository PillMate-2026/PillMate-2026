const bcrypt = require("bcrypt");
const db = require("../config/db");

// 로그인 페이지
exports.renderLoginPage = (req, res) => {
  res.render("users/login-page");
};

// 회원가입 페이지
exports.renderSignupPage = (req, res) => {
  res.render("users/signup-page");
};

// 마이페이지
exports.renderMyPage = (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }

  const userId = req.user.user_id;
  const familyId = req.user.family_id;

  const query = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN expiration_date >= CURDATE() THEN 1 ELSE 0 END) AS valid,
      SUM(CASE WHEN expiration_date < CURDATE() THEN 1 ELSE 0 END) AS expired
    FROM MEDICINE
    WHERE user_id = ?
       OR family_id = ?
  `;

  db.query(query, [userId, familyId], (err, results) => {
    if (err) {
      console.log(err);

      return res.render("users/mypage", {
        user: req.user,
        medicineStatus: {
          valid: 0,
          expired: 0,
          total: 0,
        },
      });
    }

    const status = results[0];

    res.render("users/mypage", {
      user: req.user,
      medicineStatus: {
        valid: status.valid || 0,
        expired: status.expired || 0,
        total: status.total || 0,
      },
    });
  });
};
// 회원가입 처리
exports.signup = async (req, res) => {
  const { login_id, password, passwordConfirm, name, age, gender } = req.body;

  if (password !== passwordConfirm) {
    return res.send("비밀번호가 일치하지 않습니다.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO \`USER\`
      (
        login_id,
        password,
        name,
        age,
        gender,
        provider
      )
      VALUES (?, ?, ?, ?, ?, 'local')
    `;

    db.query(
      query,
      [login_id, hashedPassword, name, age || null, gender || null],
      (err) => {
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
  const { login_id, password } = req.body;

  const query = "SELECT * FROM `USER` WHERE login_id = ?";

  db.query(query, [login_id], async (err, results) => {
    if (err) {
      console.log(err);
      return res.send("로그인 실패");
    }

    if (results.length === 0) {
      return res.send("존재하지 않는 아이디입니다.");
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
    });
  });
};

// 로그아웃
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
      return res.send("로그아웃 실패");
    }

    req.session.destroy(() => {
      res.redirect("/auth/login");
    });
  });
};

// 회원 탈퇴
exports.deleteAccount = (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }

  const userId = req.user.user_id;

  const query = "DELETE FROM `USER` WHERE user_id = ?";

  db.query(query, [userId], (err) => {
    if (err) {
      console.log(err);
      return res.send("회원 탈퇴 실패");
    }

    req.logout((err) => {
      if (err) {
        console.log(err);
        return res.send("회원 탈퇴 후 로그아웃 실패");
      }

      req.session.destroy(() => {
        res.redirect("/auth/login");
      });
    });
  });
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!req.user) {
    return res.redirect("/auth/login");
  }

  if (newPassword !== newPasswordConfirm) {
    return res.send("새 비밀번호가 일치하지 않습니다.");
  }

  try {
    db.query(
      "SELECT * FROM `USER` WHERE user_id = ?",
      [req.user.user_id],
      async (err, results) => {
        if (err) {
          console.log(err);
          return res.send("오류 발생");
        }

        if (results.length === 0) {
          return res.send("사용자를 찾을 수 없습니다.");
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
          return res.send("현재 비밀번호가 올바르지 않습니다.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query(
          "UPDATE `USER` SET password = ? WHERE user_id = ?",
          [hashedPassword, req.user.user_id],
          (err) => {
            if (err) {
              console.log(err);
              return res.send("비밀번호 변경 실패");
            }

            res.redirect("/auth/mypage");
          }
        );
      }
    );
  } catch (err) {
    console.log(err);
    res.send("오류 발생");
  }
};