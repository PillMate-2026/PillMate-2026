// models/guideModel.js
// feature/guide 브랜치

const pool = require('../db/connection');

/** 약 종류별 폐기 방법 (정적) */
const getDisposalGuide = () => [
  { type: '알약/캡슐', guide: '포장지를 제거하고 내용물만 모아서 배출', icon: '💊' },
  { type: '가루약',    guide: '포장지를 제거하고 내용물만 모아서 배출', icon: '🧴' },
  { type: '물약',      guide: '포장지를 제거하고 내용물만 모아서 배출', icon: '🫙' },
  { type: '기타',      guide: '포장지를 제거하고 내용물만 모아서 배출', icon: '🏥' },
];

/**
 * 가까운 수거함 조회
 * - limit 기본 4개 (UI 디자인: 거리순 4개 카드)
 * - GET /guide/nearby?latitude=xx&longitude=xx
 */
const getNearbyBins = async (latitude, longitude, limitCount = 4) => {
  const sql = `
    SELECT
      bin_id,
      name,
      address,
      latitude,
      longitude,
      (
        6371000 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(latitude)) *
          COS(RADIANS(longitude) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(latitude))
        )
      ) AS distance_m
    FROM MEDICINE_WASTE_BIN
    ORDER BY distance_m ASC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [latitude, longitude, latitude, limitCount]);
  return rows;
};

module.exports = { getDisposalGuide, getNearbyBins };
