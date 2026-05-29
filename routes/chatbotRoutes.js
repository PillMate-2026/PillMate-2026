const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/guide', (req, res) => {
  res.render('chatbot');
});

router.post('/chatbot/recommend', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        message: '증상 배열이 필요합니다.'
      });
    }

    const [rows] = await db.query(
      `
      SELECT DISTINCT
        m.medicine_id,
        m.name,
        m.expiration_date,

        CASE
            WHEN m.expiration_date < CURDATE()
            THEN true
            ELSE false
        END AS is_expired,

        m.item_image,
        m.efficacy,
        m.use_method,
        m.precaution,
        m.interaction,
        m.side_effect,
        GROUP_CONCAT(DISTINCT i.name SEPARATOR ', ') AS ingredients,
        GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS matched_symptoms
      FROM SYMPTOM s
      JOIN INGREDIENT_SYMPTOM ins 
        ON s.symptom_id = ins.symptom_id
      JOIN INGREDIENT i 
        ON ins.ingredient_id = i.ingredient_id
      JOIN MEDICINE_INGREDIENT mi 
        ON i.ingredient_id = mi.ingredient_id
      JOIN MEDICINE m 
        ON mi.medicine_id = m.medicine_id
      WHERE s.name IN (?)
      GROUP BY 
        m.medicine_id,
        m.name,
        m.expiration_date,
        m.item_image,
        m.efficacy,
        m.use_method,
        m.precaution,
        m.interaction,
        m.side_effect
      ORDER BY m.expiration_date ASC
      `,
      [symptoms]
    );

    res.json({
      inputSymptoms: symptoms,
      count: rows.length,
      medicines: rows
    });

  } catch (err) {
    console.error('챗봇 약 추천 조회 오류:', err);
    res.status(500).json({
      message: '챗봇 약 추천 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
