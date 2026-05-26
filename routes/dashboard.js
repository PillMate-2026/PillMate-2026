const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    console.log('userId:', userId);
    const scope = req.query.scope === 'family' ? 'family' : 'personal';
    const status = req.query.status || 'all';
    const sort = req.query.sort === 'name' ? 'name' : 'expiry';
    const search = req.query.search ? req.query.search.trim() : '';

    const [[user]] = await db.query(
      'SELECT family_id FROM USER WHERE user_id = ?',
      [userId]
    );

    const familyId = user ? user.family_id : null;
    const where = [];
    const params = [];

    if (scope === 'family') {
      if (!familyId) {
        return res.render('dashboard', {
          medicines: [],
          scope,
          status,
          sort,
          search,
          familyId,
          userId,
          total: 0,
        });
      }

      where.push('family_id = ?');
      params.push(familyId);
    } else {
      where.push('user_id = ?');
      params.push(userId);
    }

    if (search) {
      where.push('name LIKE ?');
      params.push(`%${search}%`);
    }

    if (status === 'expired') {
        where.push('expiration_date < CURDATE()');
    } else if (status === 'normal') {
        where.push('expiration_date >= CURDATE()');
    }

    const orderBy = sort === 'name' ? 'name ASC' : 'expiration_date ASC';

    const [medicines] = await db.query(
      `
      SELECT
        medicine_id,
        name,
        DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date,
        DATEDIFF(expiration_date, CURDATE()) AS days_left,
        use_method
      FROM MEDICINE
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      `,
      params
    );

    res.render('dashboard', {
      medicines,
      scope,
      status,
      sort,
      search,
      familyId,
      userId,
      total: medicines.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
