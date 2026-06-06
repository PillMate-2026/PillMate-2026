const cron = require('node-cron');
const pool = require('../db/connection');
const { createNotification } = require('../models/notificationModel');

// 날짜 상관없이 해당 약에 대한 알림이 한 번이라도 생성된 적 있는지 확인
async function alreadyNotified(userId, medicineId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM NOTIFICATION
     WHERE user_id = ?
       AND medicine_id = ?
     LIMIT 1`,
    [userId, medicineId]
  );
  return rows.length > 0;
}

/**
 * 만료/만료 임박 약을 조회해서 알림 생성
 * - 유통기한 경과(다음날부터): "XXX이(가) 오늘 만료되었습니다."
 */
async function runExpiryCheck() {
  console.log('[Scheduler] 유통기한 만료 알림 체크 시작');

  try {
    const [medicines] = await pool.query(`
      SELECT
        m.medicine_id,
        m.user_id,
        m.family_id,
        m.name,
        DATEDIFF(m.expiration_date, CURDATE()) AS days_left
      FROM MEDICINE m
      WHERE DATEDIFF(m.expiration_date, CURDATE()) < 0
        AND m.notification_muted = 0
    `);

    if (medicines.length === 0) {
      console.log('[Scheduler] 만료 대상 없음');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const med of medicines) {
      // family 소속 약은 family 구성원 전체에게 알림
      const targetUserIds = await resolveTargetUsers(med);

      for (const userId of targetUserIds) {
        const daysLeft = med.days_left;
        let content;
        let keyword;

        content = `${med.name}이(가) 오늘 만료되었습니다.`;

        // 이미 한 번이라도 알림이 생성된 약은 다시 생성하지 않음
        const alreadySent = await alreadyNotified(userId, med.medicine_id);
        if (alreadySent) {
          skipped++;
          continue;
        }

        await createNotification({
          userId,
          medicineId: med.medicine_id,
          medicineName: med.name,
          content,
        });
        created++;
      }
    }

    console.log(`[Scheduler] 완료 — 생성: ${created}건, 중복 스킵: ${skipped}건`);
  } catch (err) {
    console.error('[Scheduler] 알림 생성 중 오류:', err);
  }
}

/**
 * 약의 소유자(user_id) 또는 family 구성원 중 알림 설정이 켜진 userId 배열 반환
 */
async function resolveTargetUsers(med) {
  if (med.user_id) {
    // 개인 약: 해당 유저의 알림 설정 확인
    const [[user]] = await pool.query(
      'SELECT user_id FROM USER WHERE user_id = ? AND notification_enabled = 1',
      [med.user_id]
    );
    return user ? [user.user_id] : [];
  }

  if (med.family_id) {
    // 가족 약: 알림 설정이 켜진 구성원에게만 알림
    const [rows] = await pool.query(
      'SELECT user_id FROM USER WHERE family_id = ? AND notification_enabled = 1',
      [med.family_id]
    );
    return rows.map((r) => r.user_id);
  }

  return [];
}

cron.schedule('0 8 * * *', runExpiryCheck, {
  timezone: 'Asia/Seoul',
});

console.log('[Scheduler] 유통기한 알림 스케줄러 등록 완료 (매일 08:00 KST)');

module.exports = { runExpiryCheck };
