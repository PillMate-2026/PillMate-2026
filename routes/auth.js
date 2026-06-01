const express = require("express");
const router = express.Router();
const passport = require("passport");

const authController = require("../controllers/authController");

// 로그인 페이지
router.get("/login", authController.renderLoginPage);

// 일반 로그인 처리
router.post("/login", authController.login);

// 회원가입 페이지
router.get("/signup", authController.renderSignupPage);

// 회원가입 처리
router.post("/signup", authController.signup);

// 구글 로그인 시작
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// 구글 로그인 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/login",
  }),
  (req, res) => {
    res.redirect("/auth/mypage");
  }
);

// 마이페이지
router.get("/mypage", authController.renderMyPage);

// 로그아웃
router.post("/logout", authController.logout);

// 회원탈퇴
router.post("/delete", authController.deleteAccount);

// 비밀번호 변경
router.post("/password", authController.changePassword);

module.exports = router;