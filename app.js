require('dotenv').config();
require('./config/passport');
require('./config/db');

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const userPool = require('./db/connection');

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
// 공통 템플릿 데이터 전달
// ============================================================

app.use(async (req, res, next) => {
  res.locals.kakaoMapKey = process.env.KAKAO_MAP_API_KEY || '';

  if (!req.user) {
    res.locals.currentUser = null;
    return next();
  }

  try {
    const [[user]] = await userPool.query(
      'SELECT user_id, family_id, name, gender, age, login_id, google_id, provider, notification_enabled FROM USER WHERE user_id = ?',
      [req.user.user_id]
    );

    if (user) {
      req.user = { ...req.user, ...user };
      res.locals.currentUser = user;
    } else {
      res.locals.currentUser = req.user;
    }
  } catch (err) {
    console.error('[app] currentUser 조회 실패:', err);
    res.locals.currentUser = req.user;
  }

  next();
});

// ============================================================
// 라우터 등록
// ============================================================

const indexRoutes = require('./routes/indexRoutes');
app.use('/', indexRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const familyRoutes = require('./routes/familyRoutes');
app.use('/family', familyRoutes);

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
  require('./services/notificationScheduler');
});
