require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// =========================
// View Engine
// =========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =========================
// Middleware
// =========================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =========================
// Routes
// =========================
const indexRoutes = require('./routes/indexRoutes');
app.use('/', indexRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/notifications', notificationRoutes);

const medicineRoutes = require('./routes/medicineRoutes');
app.use('/medicines', medicineRoutes);

const dashboardRouter = require('./routes/dashboard');
app.use('/dashboard', dashboardRouter);

// =========================
// 404 처리
// =========================
app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// =========================
// Server Start
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PILLMATE 서버 실행 중: http://localhost:${PORT}`);
});