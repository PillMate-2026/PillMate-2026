// controllers/guideController.js
// feature/guide 브랜치 담당: 폐기가이드 컨트롤러

const guideModel = require('../models/guideModel');

/**
 * 폐기 가이드 페이지 렌더링
 * GET /guide
 * → views/guide.ejs 렌더링
 */
const getGuidePage = (req, res) => {
  try {
    const guides = guideModel.getDisposalGuide();
    // ⚠️ 팀원 참고: req.user는 authMiddleware.js 에서 주입됩니다.
    const user = req.user || null;
    res.render('guide', { guides, user, title: '폐기가이드' });
  } catch (err) {
    console.error('[guideController] getGuidePage 오류:', err);
    res.status(500).render('error', { message: '폐기 가이드 조회 중 오류가 발생했습니다.' });
  }
};

/**
 * 내 위치 기반 수거함 목록 조회 (JSON API)
 * GET /guide/nearby?latitude=37.1234&longitude=127.1234
 */
const getNearbyBins = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: '위치 정보(latitude, longitude)가 필요합니다.',
        data: null,
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: '유효하지 않은 위치 정보입니다.',
        data: null,
      });
    }

    const bins = await guideModel.getNearbyBins(lat, lng);

    const formattedBins = bins.map((bin) => ({
      binId: bin.bin_id,
      name: bin.name,
      address: bin.address,
      latitude: parseFloat(bin.latitude),
      longitude: parseFloat(bin.longitude),
      distanceM: Math.round(bin.distance_m),
      distanceLabel:
        bin.distance_m >= 1000
          ? `${(bin.distance_m / 1000).toFixed(1)}km`
          : `${Math.round(bin.distance_m)}m`,
    }));

    return res.status(200).json({
      ok: true,
      status: 200,
      message: '수거함 목록 조회 성공',
      data: formattedBins,
    });
  } catch (err) {
    console.error('[guideController] getNearbyBins 오류:', err);
    return res.status(500).json({
      ok: false,
      status: 500,
      message: '수거함 조회 중 서버 오류가 발생했습니다.',
      data: null,
    });
  }
};

module.exports = {
  getGuidePage,
  getNearbyBins,
};
