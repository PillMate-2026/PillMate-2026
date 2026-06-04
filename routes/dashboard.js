const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.get("/", async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;
    const status = req.query.status || "all";
    const sort = req.query.sort === "created" ? "created" : "expiry";
    const keyword =
      typeof req.query.keyword === "string"
        ? req.query.keyword.trim()
        : typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

    const [[user]] = await db.query(
      "SELECT user_id, family_id, name, gender, provider, google_id, login_id, email, profile_image FROM USER WHERE user_id = ?",
      [userId],
    );

    if (!user) {
      req.logout(() => {
        res.redirect("/auth/login");
      });
      return;
    }

    const currentUser = user;

    const familyId = currentUser.family_id;
    const scope = familyId ? "family" : "personal";
    const baseWhere = [];
    const baseParams = [];

    if (scope === "family") {
      baseWhere.push("family_id = ?");
      baseParams.push(familyId);
    } else {
      baseWhere.push("user_id = ?");
      baseParams.push(userId);
    }

    const where = [...baseWhere];
    const params = [...baseParams];

    if (keyword) {
      where.push("name LIKE ?");
      params.push(`%${keyword}%`);
    }

    if (status === "expired") {
      where.push("expiration_date < CURDATE()");
    } else if (status === "normal") {
      where.push("expiration_date >= CURDATE()");
    }

    const orderBy =
      sort === "created"
        ? "m.created_at DESC, m.medicine_id DESC"
        : "m.expiration_date ASC, m.medicine_id DESC";

    const [medicines] = await db.query(
      `
      SELECT
        m.medicine_id,
        m.name,
        DATE_FORMAT(m.expiration_date, '%Y-%m-%d') AS expiration_date,
        DATEDIFF(m.expiration_date, CURDATE()) AS days_left,
        DATE_FORMAT(m.created_at, '%Y-%m-%d') AS created_at,
        m.entp_name,
        m.item_image,
        m.efficacy,
        m.use_method,
        m.precaution,
        m.interaction,
        m.side_effect,
        SUBSTRING_INDEX(
          GROUP_CONCAT(DISTINCT i.name ORDER BY mi.ingredient_id SEPARATOR ', '),
          ', ',
          1
        ) AS ingredients
      FROM MEDICINE m
      LEFT JOIN MEDICINE_INGREDIENT mi
        ON m.medicine_id = mi.medicine_id
      LEFT JOIN INGREDIENT i
        ON mi.ingredient_id = i.ingredient_id
      WHERE ${where.map((condition) => `m.${condition}`).join(" AND ")}
      GROUP BY m.medicine_id
      ORDER BY ${orderBy}
      `,
      params,
    );

    const [statsResult] = await db.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN expiration_date >= CURDATE() THEN 1 ELSE 0 END) AS normalCount,
        SUM(CASE WHEN expiration_date < CURDATE() THEN 1 ELSE 0 END) AS expiredCount
      FROM MEDICINE
      WHERE ${baseWhere.join(" AND ")}
      `,
      baseParams,
    );

    const total = statsResult[0].total || 0;
    const normalCount = statsResult[0].normalCount || 0;
    const expiredCount = statsResult[0].expiredCount || 0;

    res.render("dashboard", {
      medicines,
      scope,
      status,
      sort,
      search: keyword,
      familyId,
      userId,
      user: currentUser,
      total,
      normalCount,
      expiredCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
