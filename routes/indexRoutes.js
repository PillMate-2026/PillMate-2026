const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('users/login-page', { title: 'PILLMATE — 스마트 약장 관리' });
});

module.exports = router;
