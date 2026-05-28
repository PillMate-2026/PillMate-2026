require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// ============================================================
// 기본 설정
// ============================================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================
// 미들웨어
// ============================================================

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

const guideRoutes = require('./routes/guideRoutes');
app.use('/disposal-guide', guideRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/notifications', notificationRoutes);

const medicineRoutes = require('./routes/medicineRoutes');
app.use('/medicines', medicineRoutes);

const dashboardRouter = require('./routes/dashboard');
app.use('/dashboard', dashboardRouter);

// ============================================================
// 404 처리
// ============================================================

app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// ============================================================
// 서버 실행
// ============================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PILLMATE 서버 실행 중: http://localhost:${PORT}`);
});
