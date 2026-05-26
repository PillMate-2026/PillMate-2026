// routes/guideRoutes.js
// feature/guide 기능: 폐기가이드 라우터

const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');

// ⚠️ 팀원 참고:
//   authMiddleware 완성 후 아래 주석 해제해서 인증 미들웨어 적용하세요.
//   const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * GET /guide
 * 폐기 가이드 페이지 렌더링 → views/guide.ejs
 * 인증 불필요 (누구나 접근 가능)
 */
router.get('/', guideController.getGuidePage);

/**
 * GET /guide/nearby?latitude=xx&longitude=xx
 * 내 위치 기반 가까운 수거함 목록 JSON 반환
 * 카카오맵 마커 데이터로 활용
 */
router.get('/nearby', guideController.getNearbyBins);

module.exports = router;

