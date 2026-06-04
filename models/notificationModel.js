const pool = require('../db/connection');

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
