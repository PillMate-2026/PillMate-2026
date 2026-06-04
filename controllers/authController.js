const bcrypt = require("bcrypt");
const db = require("../config/db");
const { promisify } = require("util");

const query = promisify(db.query).bind(db);

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

  const loginIdRegex = /^[A-Za-z0-9]{6,20}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;

  if (!loginIdRegex.test(login_id)) {
    return res.render("users/signup-page", {
      title: "회원가입",
      pageCss: "signup",
      error: "아이디는 영문 또는 숫자 6~20자로 입력해주세요.",
      formData: { login_id, name, birthYear, gender },
    });
  }

  if (!passwordRegex.test(password)) {
    return res.render("users/signup-page", {
      title: "회원가입",
      pageCss: "signup",
      error: "비밀번호는 영문과 숫자를 포함한 6~20자로 입력해주세요.",
      formData: { login_id, name, birthYear, gender },
    });
  }

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
      (err, result) => {
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

        const newUser = {
          user_id: result.insertId,
          login_id,
          name,
          age,
          gender: gender || null,
          provider: "local",
        };

        req.login(newUser, (err) => {
          if (err) {
            console.log(err);
            return res.redirect("/auth/login");
          }

          return res.redirect("/dashboard");
        });
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

      return res.redirect("/dashboard");
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
exports.deleteAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;

    // 1. 현재 사용자의 가족그룹 확인
    const users = await query(
      "SELECT family_id FROM `USER` WHERE user_id = ?",
      [userId],
    );

    const familyId = users[0]?.family_id;

    // 2. 가족그룹에 속해 있으면 가족 탈퇴 처리
    if (familyId) {
      // 탈퇴자 본인의 가족약 관련 알림 삭제
      await query(
        `
        DELETE n
        FROM NOTIFICATION n
        JOIN MEDICINE m ON n.medicine_id = m.medicine_id
        WHERE n.user_id = ?
          AND m.family_id = ?
        `,
        [userId, familyId],
      );

      // 남을 가족 구성원 수 확인
      const members = await query(
        `
        SELECT COUNT(*) AS count
        FROM \`USER\`
        WHERE family_id = ?
          AND user_id <> ?
        `,
        [familyId, userId],
      );

      // 마지막 사용자가 회원탈퇴하는 경우 가족그룹 해체
      if (Number(members[0].count) === 0) {
        // 가족약 관련 알림 삭제
        await query(
          `
          DELETE n
          FROM NOTIFICATION n
          JOIN MEDICINE m ON n.medicine_id = m.medicine_id
          WHERE m.family_id = ?
          `,
          [familyId],
        );

        await query("DELETE FROM MEDICINE WHERE family_id = ?", [familyId]);
        await query("DELETE FROM INVITE_CODE WHERE family_id = ?", [familyId]);
        await query("DELETE FROM FAMILY WHERE family_id = ?", [familyId]);
      }
    }

    // 3. 사용자 삭제
    await query("DELETE FROM `USER` WHERE user_id = ?",[userId]);

    // 4. 로그아웃 및 세션 삭제
    req.logout((err) => {
      if (err) {
        console.log(err);
        return res.redirect("/auth/login");
      }

      req.session.destroy(() => {
        res.redirect("/auth/login");
      });
    });
  } catch (err) {
    console.error(err);
    res.redirect("/auth/mypage");
    }
  };

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!req.user) {
    return res.redirect("/auth/login");
  }

  if (req.user.google_id || req.user.provider === "google") {
    return res.redirect("/auth/mypage");
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

// 알림 설정 변경
exports.toggleNotification = (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }

  const userId = req.user.user_id;
  const currentValue = req.user.notification_enabled ? 1 : 0;
  const newValue = currentValue ? 0 : 1;

  const query = `
    UPDATE \`USER\`
    SET notification_enabled = ?
    WHERE user_id = ?
  `;

  db.query(query, [newValue, userId], (err) => {
    if (err) {
      console.log(err);
      return res.redirect("/auth/mypage");
    }

    req.user.notification_enabled = newValue;
    res.redirect("/auth/mypage");
  });
};

// 프로필 수정
exports.updateProfile = (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }

  const { name, gender, age } = req.body;
  const userId = req.user.user_id;

  const query = `
    UPDATE \`USER\`
    SET name = ?, gender = ?, age = ?
    WHERE user_id = ?
  `;

  db.query(query, [name, gender || null, age || null, userId], (err) => {
    if (err) {
      console.log(err);
      return res.redirect("/auth/mypage");
    }

    req.user.name = name;
    req.user.gender = gender || null;
    req.user.age = age || null;

    return res.redirect("/auth/mypage");
  });
};

exports.checkLoginId = (req, res) => {
  const { login_id } = req.query;

  if (!login_id) {
    return res.json({
      available: false,
      message: "아이디를 입력해주세요.",
    });
  }

  db.query(
    "SELECT user_id FROM `USER` WHERE login_id = ?",
    [login_id],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.json({
          available: false,
          message: "중복 확인 중 오류가 발생했습니다.",
        });
      }

      if (results.length > 0) {
        return res.json({
          available: false,
          message: "사용할 수 없는 아이디입니다.",
        });
      }

      return res.json({
        available: true,
        message: "사용 가능한 아이디입니다.",
      });
    }
  );
};