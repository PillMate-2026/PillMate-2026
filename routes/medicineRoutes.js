const express = require('express');
const router = express.Router();

router.get('/add', (req, res) => {
  res.render('medicines/register-ocr', {
    activeMenu: 'add',
    pageTitle: '약 등록하기',
    pageIcon: 'plus',
    pageCss: 'medicine'
  });
});

router.get('/manual', (req, res) => {
  res.render('medicines/register-text', {
    activeMenu: 'add',
    pageTitle: '약 등록하기',
    pageIcon: 'plus',
    pageCss: 'medicine'
  });
});

module.exports = router;