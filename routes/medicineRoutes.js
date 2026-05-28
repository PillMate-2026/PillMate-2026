const {
  extractTextFromImage
} = require('../services/ocrService');

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

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

router.post(
  '/ocr',
  upload.single('medicineImage'),
  async (req, res) => {

    try {

      console.log(req.file);

      const extractedText =
        await extractTextFromImage(req.file.path);

      console.log(extractedText);

      res.send(`
        <h2>OCR 결과</h2>
        <pre>${extractedText}</pre>
      `);

    } catch (error) {

      console.error(error);

      res.status(500).send('OCR 처리 실패');
    }
  }
);

module.exports = router;