// public/js/guide.js
// feature/guide 브랜치 담당: 폐기가이드 페이지 프론트엔드 로직
// views/guide.ejs 에서 <script src="/js/guide.js"></script> 로 로드됨

(function () {
  'use strict';

  let kakaoMap = null;
  let markers = [];
  let infowindow = null;
  let userMarker = null;

  // ──────────────────────────────────────────
  // 초기화
  // ──────────────────────────────────────────
  function init() {
    const btn = document.getElementById('btn-find-location');
    if (btn) {
      btn.addEventListener('click', handleFindLocation);
    }

    if (window.KAKAO_MAP_UNAVAILABLE) {
      showMapUnavailable();
    } else if (window.kakao && window.kakao.maps) {
      initKakaoMap();
    } else {
      window.addEventListener('load', function () {
        if (window.kakao && window.kakao.maps) {
          initKakaoMap();
        } else {
          showMapUnavailable();
        }
      });
    }
  }

  // ──────────────────────────────────────────
  // 카카오맵 초기화
  // ──────────────────────────────────────────
  function initKakaoMap() {
    const container = document.getElementById('kakao-map');
    if (!container) return;

    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 기본 중심
      level: 5,
    };

    kakaoMap = new kakao.maps.Map(container, options);
    infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
  }

  // ──────────────────────────────────────────
  // 카카오맵 API 키 없을 때 안내
  // ──────────────────────────────────────────
  function showMapUnavailable() {
    const container = document.getElementById('kakao-map');
    if (!container) return;
    container.innerHTML = `
      <div class="map-unavailable">
        <span>🗺️</span>
        <p>지도를 불러올 수 없습니다.</p>
        <small>카카오맵 API 키를 설정해주세요.<br>.env → KAKAO_MAP_API_KEY</small>
      </div>
    `;
  }

  // ──────────────────────────────────────────
  // 내 위치로 찾기 버튼 핸들러
  // ──────────────────────────────────────────
  function handleFindLocation() {
    const btn = document.getElementById('btn-find-location');

    if (!navigator.geolocation) {
      showBinListError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '위치 찾는 중...';

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 버튼 복원
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="white" stroke-width="2"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          내 위치로 찾기
        `;

        // 지도 중심 이동 + 내 위치 마커
        if (kakaoMap) {
          const myLatLng = new kakao.maps.LatLng(lat, lng);
          kakaoMap.setCenter(myLatLng);
          kakaoMap.setLevel(4);

          if (userMarker) userMarker.setMap(null);
          userMarker = new kakao.maps.CustomOverlay({
            position: myLatLng,
            content: '<div class="my-location-marker"></div>',
            zIndex: 10,
          });
          userMarker.setMap(kakaoMap);
        }

        fetchNearbyBins(lat, lng);
      },
      function (error) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="white" stroke-width="2"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          내 위치로 찾기
        `;

        let msg = '위치를 가져올 수 없습니다.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.';
        }
        showBinListError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ──────────────────────────────────────────
  // 서버에서 수거함 목록 가져오기
  // API 경로: GET /guide/nearby (guideRoutes.js와 일치)
  // ──────────────────────────────────────────
  async function fetchNearbyBins(lat, lng) {
    showBinListLoading();

    try {
      const res = await fetch(`/guide/nearby?latitude=${lat}&longitude=${lng}`);
      const data = await res.json();

      if (!data.ok || !data.data) {
        showBinListError(data.message || '수거함 정보를 가져올 수 없습니다.');
        return;
      }

      if (data.data.length === 0) {
        showBinListEmpty();
        return;
      }

      renderBinList(data.data);
      renderMapMarkers(data.data);
    } catch (err) {
      console.error('[guide.js] fetchNearbyBins 오류:', err);
      showBinListError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  // ──────────────────────────────────────────
  // 수거함 목록 렌더링
  // ──────────────────────────────────────────
  function renderBinList(bins) {
    const listEl = document.getElementById('bin-list');
    if (!listEl) return;

    listEl.innerHTML = bins
      .map(
        (bin, idx) => `
        <div class="bin-item" data-idx="${idx}" data-lat="${bin.latitude}" data-lng="${bin.longitude}">
          <div class="bin-item-icon">📍</div>
          <div class="bin-item-info">
            <strong class="bin-item-name">${escapeHtml(bin.name)}</strong>
            <span class="bin-item-address">${escapeHtml(bin.address)}</span>
          </div>
          <span class="bin-item-distance">${bin.distanceLabel}</span>
        </div>
      `
      )
      .join('');

    // 클릭 시 지도 이동
    listEl.querySelectorAll('.bin-item').forEach(function (el) {
      el.addEventListener('click', function () {
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);

        if (kakaoMap && lat && lng) {
          kakaoMap.setCenter(new kakao.maps.LatLng(lat, lng));
          kakaoMap.setLevel(3);
          const idx = parseInt(el.dataset.idx);
          if (markers[idx]) {
            kakao.maps.event.trigger(markers[idx], 'click');
          }
        }

        listEl.querySelectorAll('.bin-item').forEach((e) => e.classList.remove('selected'));
        el.classList.add('selected');
      });
    });
  }

  // ──────────────────────────────────────────
  // 카카오맵 마커 렌더링
  // ──────────────────────────────────────────
  function renderMapMarkers(bins) {
    if (!kakaoMap) return;

    markers.forEach((m) => m.setMap(null));
    markers = [];

    const bounds = new kakao.maps.LatLngBounds();

    bins.forEach(function (bin) {
      const pos = new kakao.maps.LatLng(bin.latitude, bin.longitude);
      const marker = new kakao.maps.Marker({ position: pos, map: kakaoMap });

      bounds.extend(pos);

      kakao.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(`
          <div class="map-infowindow">
            <strong>${escapeHtml(bin.name)}</strong>
            <span>${escapeHtml(bin.address)}</span>
            <span class="map-infowindow-distance">${bin.distanceLabel}</span>
          </div>
        `);
        infowindow.open(kakaoMap, marker);
      });

      markers.push(marker);
    });

    if (bins.length > 0) kakaoMap.setBounds(bounds);
  }

  // ──────────────────────────────────────────
  // 수거함 목록 상태 표시 헬퍼
  // ──────────────────────────────────────────
  function showBinListLoading() {
    const listEl = document.getElementById('bin-list');
    if (listEl) listEl.innerHTML = '<div class="bin-list-status">🔍 가까운 수거함을 찾고 있어요...</div>';
  }

  function showBinListEmpty() {
    const listEl = document.getElementById('bin-list');
    if (listEl) listEl.innerHTML = '<div class="bin-list-status">😢 주변 500m 내 수거함 정보가 없습니다.</div>';
  }

  function showBinListError(msg) {
    const listEl = document.getElementById('bin-list');
    if (listEl) listEl.innerHTML = `<div class="bin-list-status bin-list-error">⚠️ ${escapeHtml(msg)}</div>`;
  }

  // XSS 방지
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

