let currentMedicineId = null;

function cleanText(text) {
  if (!text) return '-';

  return text
    .replace(/\r\n/g, '\n')  
    .replace(/\n\s*\n/g, '\n') 
    .trim();
}

function openEditExpirationModal() {
  alert('유통기한 수정 창을 띄울 예정입니다.');
}

async function openDisposalGuide() {
  alert('폐기 가이드 창으로 이동할 예정입니다.');
}

async function openDeleteConfirm() {
  const result = confirm('정말 삭제하시겠습니까?');

  if (!result) return;
  try {
    const response = await fetch(`/api/medicines/${currentMedicineId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      alert('삭제되었습니다.');
      location.reload();
    } else {
      alert(data.error || '삭제 실패');
    }

  } catch (error) {
    console.error(error);
    alert('서버 오류');
  }
}

window.openMedicineDetailModal = async function(id) {
  currentMedicineId = id;

  try {
  const response = await fetch(`/api/medicine-detail/${currentMedicineId}`);
  const medicine = await response.json();

  document.getElementById('modalMedicineImage').src =  //나중에 바꾸기
    medicine.item_image || '/images/logo2.png';

  document.getElementById('modalMedicineName').textContent = //나중에 바꾸기
    medicine.name || '-';

  document.getElementById('modalIngredient').innerText =
    medicine.ingredient || '-';

  document.getElementById('modalEntpName').textContent = //나중에 바꾸기
    medicine.entp_name || '-';

  document.getElementById('modalCreatedAt').innerText =
    medicine.created_at || '-';

  document.getElementById('modalExpirationDate').innerText =
    medicine.expiration_date || '-';

  const statusBadge = document.getElementById('modalStatusBadge');
  if (medicine.days_left < 0) {
    statusBadge.textContent = '폐기 필요';
    statusBadge.className = 'status-badge expired';
  } else {
    statusBadge.textContent = '복용 가능';
    statusBadge.className = 'status-badge usable';
  }

  document.getElementById('modalEfficacy').innerText =
    cleanText(medicine.efficacy);

  document.getElementById('modalUseMethod').textContent = //나중에 바꾸기
    cleanText(medicine.use_method);

  document.getElementById('modalPrecaution').innerText =
    cleanText(medicine.precaution);

  document.getElementById('modalInteraction').innerText =
    cleanText(medicine.interaction);

  document.getElementById('modalSideEffect').textContent = //나중에 바꾸기
    cleanText(medicine.side_effect);

  document.getElementById("medicineDetailModal").style.display = "flex";

  } catch (error) {
    console.error(error);
    alert('약 정보를 불러오지 못했습니다.');
}
};

window.closeMedicineDetailModal = function () {
  document.getElementById("medicineDetailModal").style.display = "none";
}
