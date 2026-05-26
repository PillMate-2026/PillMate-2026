// public/js/guide.js  —  feature/guide 브랜치
// guide.ejs 에서 <script src="/js/guide.js"></script> 로 로드

(function () {
  'use strict';

  let kakaoMap   = null;
  let infowindow = null;
  let markers    = [];       // 수거함 마커 배열
  let myOverlay  = null;     // 내 위치 커스텀 오버레이

  // ─────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────
  function init() {
    const btn = document.getElementById('btn-find-location');
    if (btn) btn.addEventListener('click', handleFindLocation);

    // 카카오맵 SDK 로드 여부 확인
    if (window.KAKAO_MAP_UNAVAILABLE) {
      renderMapUnavailable();
    } else if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      // SDK가 비동기 로드되는 경우 대기
      window.addEventListener('load', function () {
        if (window.kakao && window.kakao.maps) initMap();
        else renderMapUnavailable();
      });
    }
  }

  // ─────────────────────────────────────────
  // 카카오맵 초기화 (서울 중심 기본값)
  // ─────────────────────────────────────────
  function initMap() {
    const container = document.getElementById('kakao-map');
    if (!container) return;

    kakaoMap = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });

    // 지도 컨트롤 (확대/축소 버튼)
    kakaoMap.addControl(
      new kakao.maps.ZoomControl(),
      kakao.maps.ControlPosition.RIGHT
    );

    infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
  }

  // API 키 없을 때 안내 메시지
  function renderMapUnavailable() {
    const el = document.getElementById('kakao-map');
    if (!el) return;
    el.innerHTML = `
      <div class="map-unavailable">
        <span>🗺️</span>
        <p>지도를 불러올 수 없습니다.</p>
        <small>.env → KAKAO_MAP_API_KEY 설정 후<br>app.js에서 res.locals.kakaoMapKey로 전달하세요</small>
      </div>`;
  }

  // ─────────────────────────────────────────
  // "내 위치로 찾기" 버튼 클릭
  // ─────────────────────────────────────────
  function handleFindLocation() {
    if (!navigator.geolocation) {
      showBinStatus('이 브라우저는 위치 서비스를 지원하지 않습니다.', true);
      return;
    }

    const btn = document.getElementById('btn-find-location');
    setButtonLoading(btn, true);

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setButtonLoading(btn, false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        moveMapToUser(lat, lng);
        fetchBins(lat, lng);
      },
      function (err) {
        setButtonLoading(btn, false);
        const msg = err.code === err.PERMISSION_DENIED
          ? '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.'
          : '위치를 가져올 수 없습니다. 잠시 후 다시 시도해 주세요.';
        showBinStatus(msg, true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
      ? '📍 위치 찾는 중...'
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
           <circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="2.5"/>
           <path d="M12 2v3M12 19v3M2 12h3M19 12h3"
                 stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
         </svg>
         내 위치로 찾기`;
  }

  // ─────────────────────────────────────────
  // 지도: 내 위치로 이동 + 파란 점 마커
  // ─────────────────────────────────────────
  function moveMapToUser(lat, lng) {
    if (!kakaoMap) return;

    const latlng = new kakao.maps.LatLng(lat, lng);
    kakaoMap.setCenter(latlng);
    kakaoMap.setLevel(4);

    // 기존 내 위치 마커 제거
    if (myOverlay) myOverlay.setMap(null);

    myOverlay = new kakao.maps.CustomOverlay({
      position: latlng,
      content: '<div class="my-location-dot"></div>',
      zIndex: 10,
    });
    myOverlay.setMap(kakaoMap);
  }

  // ─────────────────────────────────────────
  // API 호출: GET /guide/nearby → 거리순 4개
  // ─────────────────────────────────────────
  async function fetchBins(lat, lng) {
    showBinLoading();

    try {
      const res  = await fetch(`/guide/nearby?latitude=${lat}&longitude=${lng}`);
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.data)) {
        showBinStatus(data.message || '수거함 정보를 불러올 수 없습니다.', true);
        return;
      }
      if (data.data.length === 0) {
        showBinStatus('주변에 수거함 정보가 없습니다.', false);
        return;
      }

      renderBinCards(data.data);
      renderMapMarkers(data.data);

    } catch (e) {
      console.error('[guide.js] fetchBins:', e);
      showBinStatus('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', true);
    }
  }

  // ─────────────────────────────────────────
  // 수거함 카드 4개 렌더링 (UI 이미지: 이름+주소+거리 뱃지)
  // ─────────────────────────────────────────
  function renderBinCards(bins) {
    const list = document.getElementById('bin-list');
    if (!list) return;

    list.innerHTML = bins.map((bin, idx) => `
      <div class="bin-card" data-idx="${idx}"
           data-lat="${bin.latitude}" data-lng="${bin.longitude}">
        <!-- 핀 아이콘 -->
        <div class="bin-card-pin">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#2e7d32"/>
            <circle cx="12" cy="9" r="2.5" fill="#fff"/>
          </svg>
        </div>
        <!-- 이름 + 주소 -->
        <div class="bin-card-info">
          <span class="bin-card-name">${esc(bin.name)}</span>
          <span class="bin-card-addr">${esc(bin.address)}</span>
          ${ bin.phone ? `<span class="bin-card-phone">${esc(bin.phone)}</span>` : '' }
        </div>
        <!-- 거리 뱃지 (UI 이미지: 320m 형태) -->
        <span class="bin-card-dist">${esc(bin.distanceLabel)}</span>
      </div>
    `).join('');

    // 카드 클릭 → 지도 해당 마커로 이동
    list.querySelectorAll('.bin-card').forEach(function (el) {
      el.addEventListener('click', function () {
        list.querySelectorAll('.bin-card').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');

        const idx = parseInt(el.dataset.idx);
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);

        if (kakaoMap && lat && lng) {
          kakaoMap.setCenter(new kakao.maps.LatLng(lat, lng));
          kakaoMap.setLevel(3);
        }
        if (markers[idx]) {
          kakao.maps.event.trigger(markers[idx], 'click');
        }
      });
    });
  }

  // ─────────────────────────────────────────
  // 카카오맵 마커 렌더링
  // ─────────────────────────────────────────
  function renderMapMarkers(bins) {
    if (!kakaoMap) return;

    // 기존 마커 제거
    markers.forEach(m => m.setMap(null));
    markers = [];

    const bounds = new kakao.maps.LatLngBounds();

    bins.forEach(function (bin, idx) {
      const pos    = new kakao.maps.LatLng(bin.latitude, bin.longitude);
      const marker = new kakao.maps.Marker({ position: pos, map: kakaoMap });

      bounds.extend(pos);

      // 마커 클릭 → 인포윈도우
      kakao.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(`
          <div class="map-infowindow">
            <strong>${esc(bin.name)}</strong>
            <span>${esc(bin.address)}</span>
            <span class="map-infowindow-dist">${esc(bin.distanceLabel)}</span>
          </div>`);
        infowindow.open(kakaoMap, marker);

        // 대응하는 카드 선택 표시
        const list = document.getElementById('bin-list');
        if (list) {
          list.querySelectorAll('.bin-card').forEach(e => e.classList.remove('selected'));
          const card = list.querySelector(`.bin-card[data-idx="${idx}"]`);
          if (card) card.classList.add('selected');
        }
      });

      markers.push(marker);
    });

    // 마커 전체가 보이도록 범위 맞추기
    if (bins.length > 0) kakaoMap.setBounds(bounds);
  }

  // ─────────────────────────────────────────
  // 목록 상태 헬퍼
  // ─────────────────────────────────────────
  function showBinLoading() {
    const list = document.getElementById('bin-list');
    if (list) list.innerHTML = '<div class="bin-status">🔍 가까운 수거함을 찾고 있어요...</div>';
  }

  function showBinStatus(msg, isError) {
    const list = document.getElementById('bin-list');
    if (list) list.innerHTML =
      `<div class="bin-status ${isError ? 'bin-status-error' : ''}">
         ${isError ? '⚠️' : '😢'} ${esc(msg)}
       </div>`;
  }

  // XSS 방지
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  // DOM 준비 후 실행
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
