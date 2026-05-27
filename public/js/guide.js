// public/js/guide.js
// feature/guide 브랜치

(function () {
  'use strict';

  let kakaoMap   = null;
  let infowindow = null;
  let markers    = [];
  let myOverlay  = null;

  // ─────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────
  function init() {
    const btn = document.getElementById('btn-find-location');

    if (btn) {
      btn.addEventListener('click', handleFindLocation);
    }

    // 카카오맵 SDK 체크
    if (window.KAKAO_MAP_UNAVAILABLE) {
      renderMapUnavailable();
      return;
    }

    // ★ 최소 수정 핵심
    // autoload=false 대응
    if (window.kakao && window.kakao.maps) {
      kakao.maps.load(function () {
        initMap();
      });
    } else {
      window.addEventListener('load', function () {
        if (window.kakao && window.kakao.maps) {
          kakao.maps.load(function () {
            initMap();
          });
        } else {
          renderMapUnavailable();
        }
      });
    }
  }

  // ─────────────────────────────────────────
  // 카카오맵 초기화
  // ─────────────────────────────────────────
  function initMap() {
    const container = document.getElementById('kakao-map');

    if (!container) {
      console.error('지도 컨테이너 없음');
      return;
    }

    kakaoMap = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });

    // 확대/축소 컨트롤
    kakaoMap.addControl(
      new kakao.maps.ZoomControl(),
      kakao.maps.ControlPosition.RIGHT
    );

    infowindow = new kakao.maps.InfoWindow({
      zIndex: 1,
    });

    console.log('카카오맵 로드 성공');
  }

  // ─────────────────────────────────────────
  // 지도 불러오기 실패
  // ─────────────────────────────────────────
  function renderMapUnavailable() {
    const el = document.getElementById('kakao-map');

    if (!el) return;

    el.innerHTML = `
      <div class="map-unavailable">
        <span>🗺️</span>
        <p>지도를 불러올 수 없습니다.</p>
        <small>
          .env → KAKAO_MAP_API_KEY 설정 후<br>
          app.js에서 res.locals.kakaoMapKey로 전달하세요
        </small>
      </div>
    `;
  }

  // ─────────────────────────────────────────
  // 내 위치 찾기
  // ─────────────────────────────────────────
  function handleFindLocation() {
    if (!navigator.geolocation) {
      showBinStatus(
        '이 브라우저는 위치 서비스를 지원하지 않습니다.',
        true
      );
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

        const msg =
          err.code === err.PERMISSION_DENIED
            ? '위치 접근 권한이 거부되었습니다.'
            : '위치를 가져올 수 없습니다.';

        showBinStatus(msg, true);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  function setButtonLoading(btn, isLoading) {
    if (!btn) return;

    btn.disabled = isLoading;

    btn.innerHTML = isLoading
      ? '📍 위치 찾는 중...'
      : `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="#fff"
            stroke-width="2.5"
          />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3"
            stroke="#fff"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        내 위치로 찾기
      `;
  }

  // ─────────────────────────────────────────
  // 내 위치 이동
  // ─────────────────────────────────────────
  function moveMapToUser(lat, lng) {
    if (!kakaoMap) return;

    const latlng = new kakao.maps.LatLng(lat, lng);

    kakaoMap.setCenter(latlng);
    kakaoMap.setLevel(4);

    if (myOverlay) {
      myOverlay.setMap(null);
    }

    myOverlay = new kakao.maps.CustomOverlay({
      position: latlng,
      content: '<div class="my-location-dot"></div>',
      zIndex: 10,
    });

    myOverlay.setMap(kakaoMap);
  }

  // ─────────────────────────────────────────
  // 주변 수거함 조회
  // ─────────────────────────────────────────
  async function fetchBins(lat, lng) {
    showBinLoading();

    try {
      // 🌟 바로 여기! 주소를 /disposal-guide/nearby 로 바꿨습니다! 🌟
      const res = await fetch(
        `/disposal-guide/nearby?latitude=${lat}&longitude=${lng}`
      );

      const data = await res.json();

      if (!data.ok || !Array.isArray(data.data)) {
        showBinStatus(
          data.message || '수거함 정보를 불러올 수 없습니다.',
          true
        );
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

      showBinStatus(
        '서버 오류가 발생했습니다.',
        true
      );
    }
  }

  // ─────────────────────────────────────────
  // 카드 렌더링
  // ─────────────────────────────────────────
  function renderBinCards(bins) {
    const list = document.getElementById('bin-list');

    if (!list) return;

    list.innerHTML = bins.map((bin, idx) => `
      <div
        class="bin-card"
        data-idx="${idx}"
        data-lat="${bin.latitude}"
        data-lng="${bin.longitude}"
      >

        <div class="bin-card-pin">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#2e7d32"
            />
            <circle cx="12" cy="9" r="2.5" fill="#fff"/>
          </svg>
        </div>

        <div class="bin-card-info">
          <span class="bin-card-name">${esc(bin.name)}</span>

          <span class="bin-card-addr">${esc(bin.address)}</span>

          ${
            bin.phone
              ? `<span class="bin-card-phone">${esc(bin.phone)}</span>`
              : ''
          }
        </div>

        <span class="bin-card-dist">
          ${esc(bin.distanceLabel)}
        </span>

      </div>
    `).join('');

    list.querySelectorAll('.bin-card').forEach(function (el) {
      el.addEventListener('click', function () {

        list.querySelectorAll('.bin-card')
          .forEach(e => e.classList.remove('selected'));

        el.classList.add('selected');

        const idx = parseInt(el.dataset.idx);
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);

        if (kakaoMap && lat && lng) {
          kakaoMap.setCenter(
            new kakao.maps.LatLng(lat, lng)
          );

          kakaoMap.setLevel(3);
        }

        if (markers[idx]) {
          kakao.maps.event.trigger(markers[idx], 'click');
        }
      });
    });
  }

  // ─────────────────────────────────────────
  // 마커 렌더링
  // ─────────────────────────────────────────
  function renderMapMarkers(bins) {
    if (!kakaoMap) return;

    markers.forEach(m => m.setMap(null));
    markers = [];

    const bounds = new kakao.maps.LatLngBounds();

    bins.forEach(function (bin, idx) {

      const pos = new kakao.maps.LatLng(
        bin.latitude,
        bin.longitude
      );

      const marker = new kakao.maps.Marker({
        position: pos,
        map: kakaoMap,
      });

      bounds.extend(pos);

      kakao.maps.event.addListener(marker, 'click', function () {

        infowindow.setContent(`
          <div class="map-infowindow">
            <strong>${esc(bin.name)}</strong>
            <span>${esc(bin.address)}</span>
            <span class="map-infowindow-dist">
              ${esc(bin.distanceLabel)}
            </span>
          </div>
        `);

        infowindow.open(kakaoMap, marker);

        const list = document.getElementById('bin-list');

        if (list) {
          list.querySelectorAll('.bin-card')
            .forEach(e => e.classList.remove('selected'));

          const card = list.querySelector(
            `.bin-card[data-idx="${idx}"]`
          );

          if (card) {
            card.classList.add('selected');
          }
        }
      });

      markers.push(marker);
    });

    if (bins.length > 0) {
      kakaoMap.setBounds(bounds);
    }
  }

  // ─────────────────────────────────────────
  // 상태 표시
  // ─────────────────────────────────────────
  function showBinLoading() {
    const list = document.getElementById('bin-list');

    if (!list) return;

    list.innerHTML = `
      <div class="bin-status">
        🔍 가까운 수거함을 찾고 있어요...
      </div>
    `;
  }

  function showBinStatus(msg, isError) {
    const list = document.getElementById('bin-list');

    if (!list) return;

    list.innerHTML = `
      <div class="bin-status ${isError ? 'bin-status-error' : ''}">
        ${isError ? '⚠️' : '😢'}
        ${esc(msg)}
      </div>
    `;
  }

  // ─────────────────────────────────────────
  // XSS 방지
  // ─────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─────────────────────────────────────────
  // 실행
  // ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();