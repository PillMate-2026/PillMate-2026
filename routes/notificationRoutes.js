const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

function requireLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, status: 401, message: '로그인이 필요합니다.', data: null });
  next();
}

router.use(requireLogin);

router.get('/', notificationController.getNotifications);
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
