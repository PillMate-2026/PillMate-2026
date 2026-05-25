require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const indexRoutes = require('./routes/indexRoutes');
app.use('/', indexRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PILLMATE 서버 실행 중: http://localhost:${PORT}`);
});

// feature/notification 라우터
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/notifications', notificationRoutes);