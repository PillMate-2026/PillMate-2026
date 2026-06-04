const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');

/** GET /disposal-guide          → 폐기가이드 페이지 */
router.get('/', guideController.getGuidePage);

/** GET /disposal-guide/nearby   → 수거함 JSON (거리순 4개) */
router.get('/nearby', guideController.getNearbyBins);

module.exports = router;