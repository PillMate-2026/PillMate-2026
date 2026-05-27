const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db/connection');

router.get('/api/medicine-detail/:id', async (req, res) => {
    const [rows] = await db.query(
        `
        SELECT
        medicine_id,
        name,
        entp_name,
        DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
        efficacy,
        use_method,
        precaution,
        interaction,
        side_effect,
        item_image
    FROM MEDICINE
    WHERE medicine_id = ?
    `,
    [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: '약 없음'
    });
  }

  res.json(rows[0]);
});

router.get('/api/medicine-test', async (req, res) => {
  try {
    const serviceKey = process.env.DRUG_API_KEY;
    const medicineName = req.query.name;

    const apiUrl =
      'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList' +
      '?serviceKey=' + serviceKey +
      '&itemName=' + encodeURIComponent('medicineName') +
      '&type=json';

    const response = await fetch(apiUrl);
    const data = await response.json();

    const item = data.body.items[0];

    res.json({
      itemName: item.itemName,
      entpName: item.entpName,
      itemSeq: item.itemSeq,
      itemImage: item.itemImage || '',
      efficacy: item.efcyQesitm,
      useMethod: item.useMethodQesitm,
      precaution: item.atpnQesitm,
      interaction: item.intrcQesitm,
      sideEffect: item.seQesitm
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'API 호출 실패'
    });
  }
});

router.delete('/api/medicines/:id', async (req, res) => {
  try {
    const medicineId = req.params.id;

    const [result] = await db.query(
      'DELETE FROM MEDICINE WHERE medicine_id = ?',
      [medicineId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: '약을 찾을 수 없습니다.'
      });
    }

    res.json({
      message: '삭제 성공'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: '서버 오류'
    });
  }
});

module.exports = router;
