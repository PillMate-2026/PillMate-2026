const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('login', { title: 'PILLMATE — 스마트 약장 관리' });
});

router.get('/medicine-detail', (req, res) => {
  res.render('medicine-detail');
});

router.get('/api/medicine-test', async (req, res) => {
  try {
    const serviceKey = process.env.DRUG_API_KEY;

    const apiUrl =
      'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList' +
      '?serviceKey=' + serviceKey +
      '&itemName=' + encodeURIComponent('타치온정') +
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

module.exports = router;
