const notificationModel = require('../models/notificationModel');

// auth 브랜치 merge 전까지 세션 or 개발용 더미 ID 사용
function getUserId(req) {
  // 우선순위: passport req.user → session.user → 개발용 더미 1
  if (req.user && req.user.userId) return req.user.userId;
  if (req.user && req.user.user_id) return req.user.user_id;
  if (req.session && req.session.user) return req.session.user.userId || req.session.user.user_id;
  // ★ 개발/시뮬레이션용: authMiddleware 없을 때 userId=1 로 동작
  //   실제 배포 전에 아래 줄 삭제하고 401 반환으로 교체
  return 1;
}

/** GET /notifications */
const getNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    const notifications = await notificationModel.getNotificationsByUserId(userId);

    const formatted = notifications.map((n) => ({
      notificationId: n.notification_id,
      medicineId: n.medicine_id,
      medicineName: n.medicine_name,
      content: n.content,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
      timeAgo: formatTimeAgo(n.created_at),
    }));

    return res.status(200).json({
      ok: true, status: 200,
      message: '알림 목록 조회 성공',
      data: formatted,
    });
  } catch (err) {
    console.error('[notificationController] getNotifications:', err);
    return res.status(500).json({
      ok: false, status: 500,
      message: '알림 목록 조회 중 서버 오류가 발생했습니다.',
      data: null,
    });
  }
};

/** PATCH /notifications/:notificationId/read */
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      return res.status(400).json({ ok: false, status: 400, message: '유효하지 않은 알림 ID입니다.', data: null });
    }

    const userId  = getUserId(req);
    const updated = await notificationModel.markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({ ok: false, status: 404, message: '존재하지 않는 알림입니다.', data: null });
    }

    return res.status(200).json({
      ok: true, status: 200,
      message: '알림 읽음 처리 완료',
      data: { notificationId, isRead: true },
    });
  } catch (err) {
    console.error('[notificationController] markNotificationAsRead:', err);
    return res.status(500).json({ ok: false, status: 500, message: '읽음 처리 중 서버 오류가 발생했습니다.', data: null });
  }
};

/** DELETE /notifications/:notificationId */
const deleteNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      return res.status(400).json({ ok: false, status: 400, message: '유효하지 않은 알림 ID입니다.', data: null });
    }

    const userId  = getUserId(req);
    const deleted = await notificationModel.deleteNotification(notificationId, userId);

    if (!deleted) {
      return res.status(404).json({ ok: false, status: 404, message: '존재하지 않는 알림입니다.', data: null });
    }

    return res.status(200).json({ ok: true, status: 200, message: '알림이 삭제되었습니다.', data: null });
  } catch (err) {
    console.error('[notificationController] deleteNotification:', err);
    return res.status(500).json({ ok: false, status: 500, message: '알림 삭제 중 서버 오류가 발생했습니다.', data: null });
  }
};

function formatTimeAgo(dateValue) {
  const date    = new Date(dateValue);
  const now     = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH / 24);

  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffH < 24)   return `${diffH}시간 전`;
  if (diffD < 30)   return `${diffD}일 전`;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = { getNotifications, markNotificationAsRead, deleteNotification };
