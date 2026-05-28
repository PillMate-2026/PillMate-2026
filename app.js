require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// ============================================================
// 기본 설정
// ============================================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// feature/guide 브랜치 머지 후 적용
const guideRoutes = require('./routes/guideRoutes');
app.use('/disposal-guide', guideRoutes);

// → GET /disposal-guide

// ============================================================
// 서버 실행
// ============================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PILLMATE 서버 실행 중: http://localhost:${PORT}`);
});