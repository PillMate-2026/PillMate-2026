// models/guideModel.js — feature/guide 버그픽스

const pool = require('../db/connection');

const getDisposalGuide = () => [
  {
    type: '알약/캡슐',
    guide: '포장지를 제거하고 내용물만 모아서 배출',
    imgFile: '/images/icons/png/pill.png',
  },
  {
    type: '가루약',
    guide: '포장지를 제거하고 내용물만 모아서 배출',
    imgFile: '/images/icons/png/powder.png',
  },
  {
    type: '물약',
    guide: '포장지를 제거하고 내용물만 모아서 배출',
    imgFile: '/images/icons/png/liquid.png',
  },
  {
    type: '기타',
    guide: '포장지를 제거하고 내용물만 모아서 배출',
    imgFile: '/images/icons/png/etc.png',
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