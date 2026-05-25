// routes/notificationRoutes.js
// feature/notification 브랜치 담당: 알림 라우터

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// ⚠️ 팀원 참고:
//   authMiddleware가 완성되면 아래 주석을 해제하세요.
//   const { authMiddleware } = require('../middleware/authMiddleware');
//   router.use(authMiddleware); // 모든 알림 API는 로그인 필요

/**
 * GET /notifications
 * 사용자 알림 목록 조회
 */
router.get('/', notificationController.getNotifications);

/**
 * PATCH /notifications/:notificationId/read
 * 알림 읽음 처리
 */
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);

/**
 * DELETE /notifications/:notificationId
 * 알림 삭제
 */
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
