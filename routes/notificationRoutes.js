const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');


router.get('/', notificationController.getNotifications);
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
