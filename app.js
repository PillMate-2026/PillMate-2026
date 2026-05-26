require('dotenv').config();
require('./config/passport');
require('./config/db');

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 기본 설정
// ============================================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================
// 미들웨어
// ============================================================

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 세션 / Passport
// ============================================================

app.use(
  session({
    secret: 'pillmate-secret',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// 카카오맵 API 키 전역 전달
// ============================================================

app.use((req, res, next) => {
  res.locals.kakaoMapKey = process.env.KAKAO_MAP_API_KEY || '';
  next();
});

// ============================================================
// 라우터 등록
// ============================================================

const indexRoutes = require('./routes/indexRoutes');
app.use('/', indexRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const guideRoutes = require('./routes/guideRoutes');
app.use('/disposal-guide', guideRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/notifications', notificationRoutes);

const medicineRoutes = require('./routes/medicineRoutes');
app.use('/medicines', medicineRoutes);

const dashboardRouter = require('./routes/dashboard');
app.use('/dashboard', dashboardRouter);

const medicineDetailRoutes = require('./routes/medicineDetailRoutes');
app.use('/', medicineDetailRoutes);

const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/', chatbotRoutes);

// ============================================================
// 404 처리
// ============================================================

app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// ============================================================
// 서버 실행
// ============================================================

app.listen(PORT, () => {
  console.log(`PILLMATE 서버 실행 중: http://localhost:${PORT}`);
});