const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    const scope = req.query.scope === 'family' ? 'family' : 'personal';
    const status = req.query.status || 'all';
    const sort = req.query.sort === 'created' ? 'created' : 'expiry';
    const keyword =
      typeof req.query.keyword === 'string'
        ? req.query.keyword.trim()
        : typeof req.query.search === 'string'
        ? req.query.search.trim()
        : '';

    const [[user]] = await db.query(
      'SELECT family_id FROM USER WHERE user_id = ?',
      [userId]
    );

    const familyId = user ? user.family_id : null;
    const baseWhere = [];
    const baseParams = [];

    if (scope === 'family') {
      if (!familyId) {
        return res.render('dashboard', {
          medicines: [],
          scope,
          status,
          sort,
          search: keyword,
          familyId,
          userId,
          total: 0,
          normalCount: 0,
          expiredCount: 0,
        });
      }

      baseWhere.push('family_id = ?');
      baseParams.push(familyId);
    } else {
      baseWhere.push('user_id = ?');
      baseParams.push(userId);
    }

    const where = [...baseWhere];
    const params = [...baseParams];

    if (keyword) {
      where.push('name LIKE ?');
      params.push(`%${keyword}%`);
    }

    if (status === 'expired') {
        where.push('expiration_date < CURDATE()');
    } else if (status === 'normal') {
        where.push('expiration_date >= CURDATE()');
    }

    const orderBy =
      sort === 'created'
        ? 'created_at DESC, medicine_id DESC'
        : 'expiration_date ASC, medicine_id DESC';

    const [medicines] = await db.query(
      `
      SELECT
        medicine_id,
        name,
        DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date,
        DATEDIFF(expiration_date, CURDATE()) AS days_left
      FROM MEDICINE
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      `,
      params
    );
    const [statsResult] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN expiration_date >= CURDATE() THEN 1 ELSE 0 END) AS normalCount,
        SUM(CASE WHEN expiration_date < CURDATE() THEN 1 ELSE 0 END) AS expiredCount
      FROM MEDICINE
      WHERE ${baseWhere.join(' AND ')}
    `, baseParams);

    const total = statsResult[0].total || 0;
    const normalCount = statsResult[0].normalCount || 0;
    const expiredCount = statsResult[0].expiredCount || 0;

    res.render('dashboard', {
      medicines,
      scope,
      status,
      sort,
      search: keyword,
      familyId,
      userId,
      total,
      normalCount,
      expiredCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
