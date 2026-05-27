// controllers/guideController.js
// feature/guide 브랜치

const guideModel = require('../models/guideModel');

/** GET /guide → views/guide.ejs */
const getGuidePage = (req, res) => {
  try {
    const guides = guideModel.getDisposalGuide();
    const user = req.user || null;
    res.render('guide', { guides, user, title: '폐기가이드', kakaoMapKey: process.env.KAKAO_MAP_API_KEY });
  } catch (err) {
    console.error('[guideController] getGuidePage:', err);
    res.status(500).render('error', { message: '폐기 가이드 조회 중 오류가 발생했습니다.' });
  }
};

/** GET /guide/nearby?latitude=xx&longitude=xx → JSON (거리순 4개) */
const getNearbyBins = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        ok: false, status: 400,
        message: '위치 정보(latitude, longitude)가 필요합니다.',
        data: null,
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        ok: false, status: 400,
        message: '유효하지 않은 위치 정보입니다.',
        data: null,
      });
    }

    const bins = await guideModel.getNearbyBins(lat, lng, 4); // UI: 4개

    const data = bins.map(b => ({
      binId: b.bin_id,
      name: b.name,
      address: b.address,
      latitude: parseFloat(b.latitude),
      longitude: parseFloat(b.longitude),
      distanceM: Math.round(b.distance_m),
      distanceLabel: b.distance_m >= 1000
        ? `${(b.distance_m / 1000).toFixed(1)}km`
        : `${Math.round(b.distance_m)}m`,
    }));

    return res.status(200).json({ ok: true, status: 200, message: '수거함 목록 조회 성공', data });
  } catch (err) {
    console.error('[guideController] getNearbyBins:', err);
    return res.status(500).json({
      ok: false, status: 500,
      message: '수거함 조회 중 서버 오류가 발생했습니다.',
      data: null,
    });
  }
};

module.exports = { getGuidePage, getNearbyBins };
