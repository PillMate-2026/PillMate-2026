const cron = require('node-cron');
const pool = require('../db/connection');
const { createNotification } = require('../models/notificationModel');

/**
 * 이미 오늘 같은 약에 대해 같은 종류의 알림이 생성됐는지 확인
 */
async function alreadyNotifiedToday(userId, medicineId, keyword) {
  const [rows] = await pool.query(
    `SELECT 1 FROM NOTIFICATION
     WHERE user_id = ?
       AND medicine_id = ?
       AND content LIKE ?
       AND DATE(created_at) = CURDATE()
     LIMIT 1`,
    [userId, medicineId, `%${keyword}%`]
  );
  return rows.length > 0;
}

/**
 * 만료/만료 임박 약을 조회해서 알림 생성
 * - 오늘 만료: "XXX이(가) 오늘 만료되었습니다."
 * - 7일 이내 만료 임박: "XXX이(가) N일 후 만료됩니다."
 */
// skipDuplicateCheck: true이면 오늘 이미 알림이 있어도 다시 생성 (약 등록 직후 호출 시 사용)
async function runExpiryCheck({ skipDuplicateCheck = false } = {}) {
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
      WHERE DATEDIFF(m.expiration_date, CURDATE()) BETWEEN -1 AND 7
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

        if (daysLeft <= 0) {
          keyword = '만료되었습니다';
          content = `${med.name}이(가) 오늘 만료되었습니다.`;
        } else {
          keyword = `${daysLeft}일 후 만료`;
          content = `${med.name}이(가) ${daysLeft}일 후 만료됩니다.`;
        }

        // 약 등록 직후 호출이 아닌 경우(매일 08:00 자동 실행)에만 중복 체크
        if (!skipDuplicateCheck) {
          const alreadySent = await alreadyNotifiedToday(userId, med.medicine_id, keyword);
          if (alreadySent) {
            skipped++;
            continue;
          }
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
 * 약의 소유자(user_id) 또는 family 구성원 전체 userId 배열 반환
 */
async function resolveTargetUsers(med) {
  if (med.user_id) {
    return [med.user_id];
  }

  if (med.family_id) {
    const [rows] = await pool.query(
      'SELECT user_id FROM USER WHERE family_id = ?',
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
