const pool = require('../db/connection');

const getDisposalGuide = () => [
  {
    type: '알약/캡슐',
    guide: '낱알 포장(PTP)에서 약만 꺼내 모아서 수거함에 배출해요',
    imgFile: '/images/png/pill.png',
  },
  {
    type: '가루약',
    guide: '봉지 그대로 밀봉해서 수거함에 배출해요',
    imgFile: '/images/png/powder.png',
  },
  {
    type: '물약',
    guide: '뚜껑을 꽉 닫아 병째로 수거함에 배출해요',
    imgFile: '/images/png/liquid.png',
  },
  {
    type: '연고/크림',
    guide: '튜브나 용기째로 수거함에 배출해요',
    imgFile: '/images/png/etc.png',
  },
];

/**
 * 가까운 수거함 조회 (거리순 4개)
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

  const [rows] = await pool.query(sql, [
    latitude,
    longitude,
    latitude,
    limitCount,
  ]);

  return rows;
};

module.exports = {
  getDisposalGuide,
  getNearbyBins,
};