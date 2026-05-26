function cleanText(text) {
  if (!text) return '-';

  return text
    .replace(/\r\n/g, '\n')  
    .replace(/\n\s*\n/g, '\n') 
    .trim();
}

function isExpired(expirationDate) {
  const today = new Date();
  const expDate = new Date(expirationDate);

  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  return expDate < today;
}

function setStatusBadge(expirationDate) {
  const usableBadge = document.getElementById('modalUsableStatus');
  const expiredBadge = document.getElementById('modalExpiredStatus');

  if (isExpired(expirationDate)) {
    usableBadge.style.display = 'none';
    expiredBadge.style.display = 'inline-block';
  } else {
    usableBadge.style.display = 'inline-block';
    expiredBadge.style.display = 'none';
  }
}

function openEditExpirationModal() {
  alert('유통기한 수정 창을 띄울 예정입니다.');
}

function openDisposalGuide() {
  alert('폐기 가이드 창으로 이동할 예정입니다.');
}

function openDeleteConfirm() {
  const result = confirm('정말 삭제하시겠습니까?');

  if (result) {
    alert('삭제 처리 예정입니다.');
  }
}

window.openMedicineDetailModal = async function() {
  const response = await fetch('/api/medicine-test');
  const medicine = await response.json();

  const createdAt = medicine.createdAt || '2026-05-11';
  const expirationDate = medicine.expirationDate || '2026-06-24';

  document.getElementById('modalMedicineImage').src =
    medicine.itemImage || '/images/logo2.png';

  document.getElementById('modalMedicineName').innerText =
    medicine.itemName || '-';

  document.getElementById('modalIngredient').innerText =
    medicine.ingredient || '-';

  document.getElementById('modalEntpName').innerText =
    medicine.entpName || '-';

  document.getElementById('modalCreatedAt').innerText = createdAt;
  document.getElementById('modalExpirationDate').innerText = expirationDate;

  setStatusBadge(expirationDate);

  document.getElementById('modalEfficacy').innerText =
    cleanText(medicine.efficacy);

  document.getElementById('modalUseMethod').innerText =
    cleanText(medicine.useMethod);

  document.getElementById('modalPrecaution').innerText =
    cleanText(medicine.precaution);

  document.getElementById('modalInteraction').innerText =
    cleanText(medicine.interaction);

  document.getElementById('modalSideEffect').innerText =
    cleanText(medicine.sideEffect);

  document.getElementById("medicineDetailModal").style.display = "flex";
}

window.closeMedicineDetailModal = function () {
  document.getElementById("medicineDetailModal").style.display = "none";
}
