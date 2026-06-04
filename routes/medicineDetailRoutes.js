const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/api/medicine-detail/:id', async (req, res) => {
    const [rows] = await db.query(
        `
        SELECT
        m.medicine_id,
        m.name,
        m.entp_name,
        DATE_FORMAT(m.expiration_date, '%Y-%m-%d') AS expiration_date,
        DATE_FORMAT(m.created_at, '%Y-%m-%d') AS created_at,
        DATEDIFF(m.expiration_date, CURDATE()) AS days_left,
        m.item_seq,
        m.efficacy,
        m.use_method,
        m.precaution,
        m.interaction,
        m.side_effect,
        m.version,
        m.item_image,
        COALESCE(GROUP_CONCAT(i.name SEPARATOR ', '), '-') AS ingredient
    FROM MEDICINE m
    LEFT JOIN MEDICINE_INGREDIENT mi
      ON m.medicine_id = mi.medicine_id
    LEFT JOIN INGREDIENT i
      ON mi.ingredient_id = i.ingredient_id
    WHERE m.medicine_id = ?
    GROUP BY m.medicine_id
    `,
    [req.params.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: '약 정보를 찾을 수 없습니다.'});
  }

  res.json(rows[0]);
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

//유통기한 수정
router.patch('/api/medicine-detail/:id/expiration', async (req, res) => {
  try {
    const medicineId = req.params.id;
    const { expirationDate, version } = req.body;

    if (!expirationDate || version === undefined) {
      return res.status(400).json({
        error: '유통기한과 version 값이 필요합니다.'
      });
    }

    const [result] = await db.query(
      `UPDATE MEDICINE
       SET expiration_date = ?,
           version = version + 1
       WHERE medicine_id = ?
         AND version = ?`,
      [expirationDate, medicineId, version]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        error: '다른 사용자가 먼저 수정했습니다. 최신 정보를 다시 불러옵니다.'
      });
    }

    const [rows] = await db.query(
      `
        SELECT
        m.medicine_id,
        m.name,
        m.entp_name,
        DATE_FORMAT(m.expiration_date, '%Y-%m-%d') AS expiration_date,
        DATE_FORMAT(m.created_at, '%Y-%m-%d') AS created_at,
        DATEDIFF(m.expiration_date, CURDATE()) AS days_left,
        m.item_seq,
        m.efficacy,
        m.use_method,
        m.precaution,
        m.interaction,
        m.side_effect,
        m.version,
        m.item_image,
        COALESCE(GROUP_CONCAT(i.name SEPARATOR ', '), '-') AS ingredient
      FROM MEDICINE m
      LEFT JOIN MEDICINE_INGREDIENT mi
        ON m.medicine_id = mi.medicine_id
      LEFT JOIN INGREDIENT i
        ON mi.ingredient_id = i.ingredient_id
      WHERE m.medicine_id = ?
      GROUP BY m.medicine_id
      `,
      [medicineId]
    );

    res.json({
      message: '유통기한이 수정되었습니다.',
      medicine: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '유통기한 수정 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
