// models/guideModel.js
// feature/guide 브랜치 담당: 폐기가이드 + 수거함 위치 조회

const pool = require('../db/connection');

/**
 * 약 종류별 폐기 방법 조회 (정적 데이터 반환)
 * API: GET /guide
 */
const getDisposalGuide = () => {
  return [
    {
      type: '알약/캡슐',
      guide: '포장지를 제거하고 내용물만 모아서 봉투에 담아 배출',
      detail: '알루미늄 포일, 플라스틱 케이스 등 포장재는 일반 쓰레기로 분리 배출하고, 알약/캡슐 내용물만 별도 봉투에 담아 폐의약품 수거함에 제출하세요.',
      icon: '💊',
    },
    {
      type: '가루약',
      guide: '포장된 상태로 봉투에 담아 배출',
      detail: '낱개 포장이 된 가루약은 봉투째로 모아 폐의약품 수거함에 배출하세요. 뜯지 않은 채로 제출하는 것이 가장 좋습니다.',
      icon: '🧴',
    },
    {
      type: '물약/시럽',
      guide: '용기 뚜껑을 닫아 밀봉 후 수거함에 배출',
      detail: '액체 의약품은 반드시 뚜껑을 닫고 밀봉하여 배출하세요. 하수구나 변기에 버리면 수질 오염의 원인이 됩니다.',
      icon: '🫙',
    },
    {
      type: '연고/크림',
      guide: '튜브째로 밀봉하여 수거함에 배출',
      detail: '연고나 크림은 튜브나 용기 그대로 밀봉하여 배출합니다. 내용물을 짜내지 않고 원래 용기에 담긴 채로 제출하세요.',
      icon: '🧴',
    },
    {
      type: '안약',
      guide: '용기 뚜껑을 닫아 밀봉 후 수거함에 배출',
      detail: '점안액은 뚜껑을 단단히 닫아 밀봉하여 배출합니다. 개봉 후 1개월이 지난 안약은 사용하지 마시고 즉시 폐기하세요.',
      icon: '👁️',
    },
    {
      type: '기타',
      guide: '포장지를 제거하고 내용물만 모아서 배출',
      detail: '위 분류에 해당하지 않는 의약품은 포장지를 제거하고 내용물만 수거함에 배출하세요. 파스, 좌약 등도 동일하게 처리합니다.',
      icon: '🏥',
    },
  ];
};

/**
 * 가까운 폐의약품 수거함 조회
 * API: GET /guide/nearby?latitude=xx&longitude=xx
 *
 * ⚠️ 팀원 참고:
 *   - MEDICINE_WASTE_BIN 테이블에서 수거함 데이터를 가져옵니다.
 *   - Haversine 공식으로 거리 계산, 최대 10개 반환
 */
const getNearbyBins = async (latitude, longitude, limitCount = 10) => {
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

module.exports = {
  getDisposalGuide,
  getNearbyBins,
};

