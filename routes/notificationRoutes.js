const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// ⚠️ 팀원 참고:
//   authMiddleware가 완성되면 아래 주석을 해제하세요.
//   const { authMiddleware } = require('../middleware/authMiddleware');
//   router.use(authMiddleware); // 모든 알림 API는 로그인 필요

router.get('/', notificationController.getNotifications);
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
