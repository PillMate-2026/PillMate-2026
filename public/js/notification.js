// public/js/notification.js
// feature/notification 브랜치 담당: 알림 모달 프론트엔드 로직
// header.ejs / topbar 부분에 <script src="/js/notification.js"></script> 추가 필요

(function () {
  'use strict';

  // ──────────────────────────────────────────
  // 초기화
  // ──────────────────────────────────────────
  function init() {
    // Bell 버튼
    const bellBtn = document.getElementById('notification-bell-btn');
    if (!bellBtn) return; // 로그인 전 페이지에서는 Bell 없음

    bellBtn.addEventListener('click', handleBellClick);

    // 모달 생성 및 삽입
    createNotificationModal();

    // 모달 닫기: 외부 클릭
    document.addEventListener('click', function (e) {
      const modal = document.getElementById('notification-modal');
      if (modal && modal.classList.contains('open')) {
        if (!modal.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
          closeModal();
        }
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // 페이지 로드 시 읽지 않은 알림 개수 배지 갱신
    fetchUnreadBadge();
  }

  // ──────────────────────────────────────────
  // 모달 DOM 생성
  // ──────────────────────────────────────────
  function createNotificationModal() {
    if (document.getElementById('notification-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'notification-modal';
    modal.className = 'notification-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', '알림창');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="notif-modal-header">
        <span class="notif-modal-title">알림창</span>
        <button class="notif-modal-close" id="notif-modal-close-btn" aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="2" y1="2" x2="16" y2="16" stroke="#555" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="2" x2="2" y2="16" stroke="#555" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="notif-modal-body" id="notif-modal-body">
        <div class="notif-loading">알림을 불러오는 중...</div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('notif-modal-close-btn').addEventListener('click', closeModal);
  }

  // ──────────────────────────────────────────
  // Bell 클릭 → 모달 열기 + 알림 로드
  // ──────────────────────────────────────────
  function handleBellClick(e) {
    e.stopPropagation();
    const modal = document.getElementById('notification-modal');
    if (!modal) return;

    if (modal.classList.contains('open')) {
      closeModal();
    } else {
      openModal();
      loadNotifications();
    }
  }

  function openModal() {
    const modal = document.getElementById('notification-modal');
    if (modal) modal.classList.add('open');
  }

  function closeModal() {
    const modal = document.getElementById('notification-modal');
    if (modal) modal.classList.remove('open');
  }

  // ──────────────────────────────────────────
  // 알림 목록 API 호출
  // ──────────────────────────────────────────
  async function loadNotifications() {
    const body = document.getElementById('notif-modal-body');
    if (!body) return;

    body.innerHTML = '<div class="notif-loading">알림을 불러오는 중...</div>';

    try {
      const res = await fetch('/notifications', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.data)) {
        body.innerHTML = '<div class="notif-empty">알림을 불러올 수 없습니다.</div>';
        return;
      }

      if (data.data.length === 0) {
        body.innerHTML = '<div class="notif-empty">새로운 알림이 없어요 🎉</div>';
        return;
      }

      renderNotifications(data.data);
    } catch (err) {
      console.error('[notification] loadNotifications 오류:', err);
      body.innerHTML = '<div class="notif-empty notif-error">알림 로드 중 오류가 발생했습니다.</div>';
    }
  }

  // ──────────────────────────────────────────
  // 알림 목록 렌더링
  // ──────────────────────────────────────────
  function renderNotifications(notifications) {
    const body = document.getElementById('notif-modal-body');
    if (!body) return;

    body.innerHTML = '';

    notifications.forEach(function (notif) {
      const item = document.createElement('div');
      item.className = 'notif-item' + (notif.isRead ? ' notif-item--read' : '');
      item.dataset.id = notif.notificationId;

      item.innerHTML = `
        <div class="notif-item-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="10" rx="6" ry="4" fill="${notif.isRead ? '#bdbdbd' : '#333'}"/>
            <rect x="8" y="13" width="12" height="7" rx="3" fill="${notif.isRead ? '#bdbdbd' : '#333'}"/>
            <rect x="11" y="20" width="6" height="2" rx="1" fill="${notif.isRead ? '#bdbdbd' : '#555'}"/>
          </svg>
        </div>
        <div class="notif-item-content">
          <p class="notif-item-text">
            <strong class="notif-item-medicine">${escapeHtml(notif.medicineName)}</strong>
            ${escapeHtml(notif.content.replace(notif.medicineName, '').trim())}
          </p>
          <span class="notif-item-time">${escapeHtml(notif.timeAgo)}</span>
        </div>
        <button class="notif-item-delete" data-id="${notif.notificationId}" aria-label="알림 삭제">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M6 4h8M4 6h12M8 6v9M12 6v9M5 6l1 11h8l1-11" stroke="#bdbdbd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;

      // 클릭 시 읽음 처리
      item.addEventListener('click', function (e) {
        if (e.target.closest('.notif-item-delete')) return; // 삭제 버튼 클릭은 제외
        if (!notif.isRead) {
          handleMarkAsRead(notif.notificationId, item);
        }
      });

      // 삭제 버튼
      item.querySelector('.notif-item-delete').addEventListener('click', function (e) {
        e.stopPropagation();
        handleDelete(notif.notificationId, item);
      });

      body.appendChild(item);
    });
  }

  // ──────────────────────────────────────────
  // 읽음 처리
  // ──────────────────────────────────────────
  async function handleMarkAsRead(notificationId, itemEl) {
    try {
      const res = await fetch(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();

      if (data.ok) {
        // 읽음 → 회색 배경 처리 (UI 디자인 반영)
        itemEl.classList.add('notif-item--read');
        decrementBadge();
      }
    } catch (err) {
      console.error('[notification] handleMarkAsRead 오류:', err);
    }
  }

  // ──────────────────────────────────────────
  // 알림 삭제
  // ──────────────────────────────────────────
  async function handleDelete(notificationId, itemEl) {
    try {
      const res = await fetch(`/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();

      if (data.ok) {
        // 읽지 않은 알림이면 배지 감소
        if (!itemEl.classList.contains('notif-item--read')) {
          decrementBadge();
        }
        // 슬라이드 아웃 애니메이션 후 제거
        itemEl.classList.add('notif-item--removing');
        setTimeout(function () {
          itemEl.remove();
          // 알림이 하나도 없으면 빈 상태 표시
          const body = document.getElementById('notif-modal-body');
          if (body && body.querySelectorAll('.notif-item').length === 0) {
            body.innerHTML = '<div class="notif-empty">새로운 알림이 없어요 🎉</div>';
          }
        }, 300);
      }
    } catch (err) {
      console.error('[notification] handleDelete 오류:', err);
    }
  }

  // ──────────────────────────────────────────
  // 읽지 않은 알림 배지 (페이지 로드 시)
  // ──────────────────────────────────────────
  async function fetchUnreadBadge() {
    // ⚠️ 팀원 참고:
    //   /notifications API를 통해 is_read=false 개수를 계산합니다.
    //   별도 badge API 없이 목록 API로 계산합니다.
    try {
      const res = await fetch('/notifications', {
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.data)) return;

      const unreadCount = data.data.filter((n) => !n.isRead).length;
      updateBadge(unreadCount);
    } catch {
      // 로그인 안 된 상태 등은 무시
    }
  }

  function updateBadge(count) {
    const bellBtn = document.getElementById('notification-bell-btn');
    if (!bellBtn) return;

    let badge = bellBtn.querySelector('.notif-badge');
    if (count <= 0) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notif-badge';
      bellBtn.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
  }

  function decrementBadge() {
    const badge = document.querySelector('.notif-badge');
    if (!badge) return;
    const current = parseInt(badge.textContent) || 0;
    if (current <= 1) {
      badge.remove();
    } else {
      badge.textContent = String(current - 1);
    }
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
