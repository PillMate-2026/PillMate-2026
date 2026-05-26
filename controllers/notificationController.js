// controllers/notificationController.js
// feature/notification 브랜치 담당: 알림 컨트롤러

const notificationModel = require('../models/notificationModel');

/**
 * 알림 목록 조회
 * GET /notifications
 * 
 * ⚠️ 팀원 참고:
 *   - authMiddleware가 req.user를 주입해줘야 합니다.
 *   - routes/notificationRoutes.js에서 authMiddleware 적용 필요
 */
const getNotifications = async (req, res) => {
  try {
    // ⚠️ authMiddleware 완성 전 임시 처리:
    //   authMiddleware가 없으면 401 반환
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        status: 401,
        message: '인증되지 않은 사용자입니다.',
        data: null,
      });
    }

    const userId = req.user.userId;
    const notifications = await notificationModel.getNotificationsByUserId(userId);

    // DB 컬럼명 → camelCase 변환
    const formatted = notifications.map((n) => ({
      notificationId: n.notification_id,
      medicineId: n.medicine_id,
      medicineName: n.medicine_name,
      content: n.content,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
      // 프론트에서 쓸 상대 시간 문자열
      timeAgo: formatTimeAgo(n.created_at),
    }));

    return res.status(200).json({
      ok: true,
      status: 200,
      message: '알림 목록 조회 성공',
      data: formatted,
    });
  } catch (err) {
    console.error('[notificationController] getNotifications 오류:', err);
    return res.status(500).json({
      ok: false,
      status: 500,
      message: '알림 목록 조회 중 서버 오류가 발생했습니다.',
      data: null,
    });
  }
};

/**
 * 알림 읽음 처리
 * PATCH /notifications/:notificationId/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        status: 401,
        message: '인증되지 않은 사용자입니다.',
        data: null,
      });
    }

    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: '유효하지 않은 알림 ID입니다.',
        data: null,
      });
    }

    const userId = req.user.userId;
    const updated = await notificationModel.markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: '존재하지 않는 알림입니다.',
        data: null,
      });
    }

    return res.status(200).json({
      ok: true,
      status: 200,
      message: '알림 읽음 처리 완료',
      data: { notificationId, isRead: true },
    });
  } catch (err) {
    console.error('[notificationController] markNotificationAsRead 오류:', err);
    return res.status(500).json({
      ok: false,
      status: 500,
      message: '알림 읽음 처리 중 서버 오류가 발생했습니다.',
      data: null,
    });
  }
};

/**
 * 알림 삭제
 * DELETE /notifications/:notificationId
 */
const deleteNotification = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        status: 401,
        message: '인증되지 않은 사용자입니다.',
        data: null,
      });
    }

    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: '유효하지 않은 알림 ID입니다.',
        data: null,
      });
    }

    const userId = req.user.userId;
    const deleted = await notificationModel.deleteNotification(notificationId, userId);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: '존재하지 않는 알림입니다.',
        data: null,
      });
    }

    return res.status(200).json({
      ok: true,
      status: 200,
      message: '알림이 삭제되었습니다.',
      data: null,
    });
  } catch (err) {
    console.error('[notificationController] deleteNotification 오류:', err);
    return res.status(500).json({
      ok: false,
      status: 500,
      message: '알림 삭제 처리 중 서버 오류가 발생했습니다.',
      data: null,
    });
  }
};

// ──────────────────────────────────────────
// 시간 포맷 헬퍼 (프론트로 내려보낼 때 사용)
// ──────────────────────────────────────────
function formatTimeAgo(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 30) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
};
