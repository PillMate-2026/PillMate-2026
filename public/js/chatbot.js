function extractSymptoms(text) {
  const symptoms = [];

  if (text.includes('두통') || text.includes('머리')) {
    symptoms.push('두통');
  }

  if (text.includes('열') || text.includes('발열')) {
    symptoms.push('발열');
  }

  if (text.includes('콧물')) {
    symptoms.push('콧물');
  }

  if (text.includes('코막힘') || text.includes('코가 막')) {
    symptoms.push('코막힘');
  }

  if (text.includes('근육통') || text.includes('몸살')) {
    symptoms.push('근육통');
  }

  return symptoms;
}

function addMessage(type, message) {
  const chatMessages = document.getElementById('chatMessages');

  const messageDiv = document.createElement('div');
  messageDiv.className = type === 'user' ? 'user-message' : 'bot-message';
  messageDiv.innerHTML = message;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const userText = input.value.trim();

  if (!userText) return;

  addMessage('user', userText);
  input.value = '';

  const symptoms = extractSymptoms(userText);

  if (symptoms.length === 0) {
    addMessage('bot', '증상을 잘 찾지 못했어요. 예: 두통, 발열, 콧물처럼 입력해 주세요.');
    return;
  }

  try {
    const response = await fetch('/chatbot/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symptoms })
    });

    const data = await response.json();

    if (data.count === 0) {
      addMessage('bot', `입력하신 증상(${symptoms.join(', ')})과 관련된 약을 약장에서 찾지 못했어요.`);
      return;
    }

    let resultMessage = `입력하신 증상: ${symptoms.join(', ')}<br><br>`;

    data.medicines.forEach((medicine, index) => {
      resultMessage += `<strong>${index + 1}. ${medicine.name}</strong><br>`;
      resultMessage += `성분: ${medicine.ingredients}<br>`;
      resultMessage += `효능: ${medicine.efficacy}<br>`;

      if (medicine.is_expired === 1) {
        resultMessage += `<span class="expired-warning">이 약은 유통기한이 지났습니다. 복용하지 말고 폐기해 주세요.</span><br>`;
      }

      resultMessage += `<br>`;
    });

    addMessage('bot', resultMessage);

  } catch (err) {
    console.error(err);
    addMessage('bot', '약 추천 중 오류가 발생했습니다.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInput');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
});