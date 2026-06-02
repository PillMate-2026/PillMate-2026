let currentMedicineId = null;
let currentMedicineVersion = null;

function cleanText(text) {
  if (!text) return '-';

  return text
    .replace(/\r\n/g, '\n')  
    .replace(/\n\s*\n/g, '\n') 
    .trim();
}

//수정모달 열기
window.openEditExpirationModal = function() {
  if (!currentMedicineId) {
    alert('수정할 약 정보가 없습니다.');
    return;
  }

  const currentExpirationDate =
    document.getElementById('modalExpirationDate').textContent.trim().slice(0, 10);

  document.getElementById('editExpirationDateInput').value = currentExpirationDate;
  document.getElementById('expirationEditModal').style.display = 'flex';
};

//수정모달 닫기
window.closeEditExpirationModal = function() {
  document.getElementById('expirationEditModal').style.display = 'none';
};

//수정모달 수정완료
window.submitEditExpiration = async function() {
  const newExpirationDate =
    document.getElementById('editExpirationDateInput').value;

  if (!newExpirationDate) {
    alert('유통기한을 선택해주세요.');
    return;
  }

  try {
    const response = await fetch(`/api/medicine-detail/${currentMedicineId}/expiration`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expirationDate: newExpirationDate,
        version: currentMedicineVersion
      })
    });

    const data = await response.json();

    if (response.status === 409) {
      alert(data.error);
      closeEditExpirationModal();
      await openMedicineDetailModal(currentMedicineId);
      return;
    }

    if (!response.ok) {
      alert(data.error || '수정에 실패했습니다.');
      return;
    }

    alert('유통기한이 수정되었습니다.');
    location.reload();

  } catch (err) {
    console.error(err);
    alert('서버 오류가 발생했습니다.');
  }
};


window.openDisposalGuide = async function() {
  location.href = '/disposal-guide';
}

window.openDeleteConfirm = async function() {
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

  currentMedicineVersion = medicine.version;

  document.getElementById('modalMedicineImage').src =  //나중에 바꾸기
    medicine.item_image || '/images/png/logo2.png';

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
