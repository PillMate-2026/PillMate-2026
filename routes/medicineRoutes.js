const pool = require('../db/connection');

const fs = require('fs');

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const {
  searchMedicine
} = require('../services/medicineApiService');

const {
  extractTextFromImage
} = require('../services/ocrService');

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

function requireLogin(req, res, next) {

  if (!req.user) {
    return res.redirect('/auth/login');
  }

  next();

}

router.get('/autocomplete', async (req, res) => {

  try {

    const keyword = req.query.keyword;

    const result =
      await searchMedicine(keyword);

    res.json(
      result.body.items || []
    );

  } catch (error) {

    console.error(error);

    res.json([]);

  }

});

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

router.get(
  '/add',
  requireLogin,
  (req, res) => {
    res.render('medicines/register-ocr', {
      activeMenu: 'add',
      pageTitle: '약 등록하기',
      pageIcon: 'plus',
      pageCss: 'medicine'
    });
  }
);

router.get('/manual', (req, res) => {
  res.render('medicines/register-text', {
    activeMenu: 'add',
    pageTitle: '약 등록하기',
    pageIcon: 'plus',
    pageCss: 'medicine',
    medicineName: '',
    medicineCandidates: []
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

      /* OCR 결과 줄 단위 분리 */
      const lines = extractedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);

      /* 약 이름 후보 찾기 */
    const candidates = lines.filter(line => {

      return (
        line.length >= 2 &&
        !line.includes('주의') &&
        !line.includes('일반의약품') &&
        !line.includes('품목기준코드')
      );

    });

    console.log('후보군:', candidates);

    let medicineName = candidates[0] || '';
    let medicineCandidates = [];


      for (const candidate of candidates) {

        const normalizedCandidate =
          candidate.replace(/\s/g, '');

        const result =
          await searchMedicine(normalizedCandidate);

        console.log(
          normalizedCandidate,
          result.body.totalCount
        );

        if (result.body.totalCount > 0) {

          medicineName = normalizedCandidate;

          medicineCandidates =
            result.body.items;
          console.log(result.body.items[0]);

          break;
        }
      }

      res.render('medicines/register-text', {
        activeMenu: 'add',
        pageTitle: '약 등록하기',
        pageIcon: 'plus',
        pageCss: 'medicine',
        medicineName,
        medicineCandidates
      });
    } catch (error) {

      console.error(error);

      res.status(500).send('OCR 처리 실패');
    }
  }
);
router.post('/register', async (req, res) => {
console.log(req.body);
  try {

    const {
      medicineName,
      expiryDate,
      itemSeq,
      entpName,
      itemImage,
      efficacy,
      useMethod,
      precaution,
      interaction,
      sideEffect
    } = req.body;

console.log('약 이름:', medicineName);
console.log('유통기한:', expiryDate);

const userId = req.user.user_id;

await pool.query(
  `
  INSERT INTO MEDICINE
  (
    user_id,
    name,
    expiration_date,
    item_seq,
    entp_name,
    item_image,
    efficacy,
    use_method,
    precaution,
    interaction,
    side_effect
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    userId,
    medicineName,
    expiryDate,
    itemSeq,
    entpName,
    itemImage,
    efficacy,
    useMethod,
    precaution,
    interaction,
    sideEffect
  ]
);

res.redirect('/dashboard');

  } catch (error) {

    console.error(error);

    res.status(500).send('등록 실패');
  }

});
module.exports = router;