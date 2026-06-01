const bcrypt = require("bcrypt");
const db = require("../config/db");

// 로그인 페이지
exports.renderLoginPage = (req, res) => {
  res.render("users/login-page", {
    title: "로그인",
    pageCss: "login",
    error: null,
    login_id: "",
  });
};

// 회원가입 페이지
exports.renderSignupPage = (req, res) => {
  res.render("users/signup-page", {
    title: "회원가입",
    pageCss: "signup",
    error: null,
    formData: {},
  });
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
        title: "마이페이지",
        pageCss: "mypage",
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
      title: "마이페이지",
      pageCss: "mypage",
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
  const { login_id, password, passwordConfirm, name, birthYear, gender } = req.body;

  if (password !== passwordConfirm) {
    return res.render("users/signup-page", {
      title: "회원가입",
      pageCss: "signup",
      error: "비밀번호가 일치하지 않습니다.",
      formData: { login_id, name, birthYear, gender },
    });
  }

  let age = null;

  if (birthYear) {
    const currentYear = new Date().getFullYear();
    age = currentYear - Number(birthYear);
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
      [login_id, hashedPassword, name, age, gender || null],
      (err) => {
        if (err) {
          console.log(err);

          if (err.code === "ER_DUP_ENTRY") {
            return res.render("users/signup-page", {
              title: "회원가입",
              pageCss: "signup",
              error: "이미 사용 중인 아이디입니다.",
              formData: { login_id, name, birthYear, gender },
            });
          }

          return res.render("users/signup-page", {
            title: "회원가입",
            pageCss: "signup",
            error: "회원가입 중 오류가 발생했습니다.",
            formData: { login_id, name, birthYear, gender },
          });
        }

        res.redirect("/auth/login");
      }
    );
  } catch (err) {
    console.log(err);

    res.render("users/signup-page", {
      title: "회원가입",
      pageCss: "signup",
      error: "회원가입 중 오류가 발생했습니다.",
      formData: { login_id, name, birthYear, gender },
    });
  }
};

// 일반 로그인 처리
exports.login = (req, res) => {
  const { login_id, password } = req.body;

  const query = "SELECT * FROM `USER` WHERE login_id = ?";

  db.query(query, [login_id], async (err, results) => {
    if (err) {
      console.log(err);

      return res.render("users/login-page", {
        title: "로그인",
        pageCss: "login",
        error: "로그인 중 오류가 발생했습니다.",
        login_id,
      });
    }

    if (results.length === 0) {
      return res.render("users/login-page", {
        title: "로그인",
        pageCss: "login",
        error: "아이디 또는 비밀번호가 올바르지 않습니다.",
        login_id,
      });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("users/login-page", {
        title: "로그인",
        pageCss: "login",
        error: "아이디 또는 비밀번호가 올바르지 않습니다.",
        login_id,
      });
    }

    req.login(user, (err) => {
      if (err) {
        console.log(err);

        return res.render("users/login-page", {
          title: "로그인",
          pageCss: "login",
          error: "로그인 중 오류가 발생했습니다.",
          login_id,
        });
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
      return res.redirect("/auth/mypage");
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
      return res.redirect("/auth/mypage");
    }

    req.logout((err) => {
      if (err) {
        console.log(err);
        return res.redirect("/auth/login");
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
    return res.redirect("/auth/mypage");
  }

  try {
    db.query(
      "SELECT * FROM `USER` WHERE user_id = ?",
      [req.user.user_id],
      async (err, results) => {
        if (err) {
          console.log(err);
          return res.redirect("/auth/mypage");
        }

        if (results.length === 0) {
          return res.redirect("/auth/login");
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
          return res.redirect("/auth/mypage");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query(
          "UPDATE `USER` SET password = ? WHERE user_id = ?",
          [hashedPassword, req.user.user_id],
          (err) => {
            if (err) {
              console.log(err);
              return res.redirect("/auth/mypage");
            }

            res.redirect("/auth/mypage");
          }
        );
      }
    );
  } catch (err) {
    console.log(err);
    res.redirect("/auth/mypage");
  }
};