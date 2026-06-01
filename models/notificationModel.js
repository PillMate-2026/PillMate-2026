const pool = require('../db/connection');

/**
 * 팀원 참고:
 *   - NOTIFICATION 테이블을 조회합니다.
 *   - req.user.userId (authMiddleware 주입)로 필터링합니다.
 */
const getNotificationsByUserId = async (userId) => {
  const sql = `
    SELECT
      notification_id,
      user_id,
      medicine_id,
      medicine_name,
      content,
      created_at,
      is_read
    FROM NOTIFICATION
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
};

const markAsRead = async (notificationId, userId) => {
  const sql = `
    UPDATE NOTIFICATION
    SET is_read = TRUE
    WHERE notification_id = ? AND user_id = ?
  `;
  const [result] = await pool.query(sql, [notificationId, userId]);
  return result.affectedRows > 0;
};

const deleteNotification = async (notificationId, userId) => {
  const sql = `
    DELETE FROM NOTIFICATION
    WHERE notification_id = ? AND user_id = ?
  `;
  const [result] = await pool.query(sql, [notificationId, userId]);
  return result.affectedRows > 0;
};

/**
 * 알림 생성 (스케줄러에서 호출)
 * 
 * ⚠️ 팀원 참고:
 *   - 유통기한 만료 스케줄러에서 이 함수를 호출합니다.
 *   - medicine_id가 NULL이어도 medicine_name은 반드시 저장합니다. (DB 설계 반정규화 의도)
 */
const createNotification = async ({ userId, medicineId, medicineName, content }) => {
  const sql = `
    INSERT INTO NOTIFICATION (user_id, medicine_id, medicine_name, content)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [userId, medicineId || null, medicineName, content]);
  return result.insertId;
};

module.exports = {
  getNotificationsByUserId,
  markAsRead,
  deleteNotification,
  createNotification,
};
