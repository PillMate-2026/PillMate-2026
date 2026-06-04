//메세지 추가
function addMessage(type, message) {
  const chatMessages = document.getElementById("chatMessages");

  const row = document.createElement("div");
  row.className = type === "user" ? "message-row user" : "message-row bot";

  const bubble = document.createElement("div");
  bubble.className = type === "user" ? "user-message" : "bot-message";
  if (type === "medicine") {
    bubble.className = "medicine-message";
  }
  bubble.innerHTML = message;

  row.appendChild(bubble);
  chatMessages.appendChild(row);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

//응답 메세지 설정
async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const userText = input.value.trim();

  if (!userText) return;

  addMessage("user", userText);
  input.value = "";

  try {
    const response = await fetch("/chatbot/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userText }),
    });

    const data = await response.json();

    if (!response.ok) {
      addMessage("bot", data.message || "약 추천 중 오류가 발생했습니다.");
      return;
    }

    if (data.messages && Array.isArray(data.messages)) {
      addMessage("bot", data.messages[0].replace(/\n/g, "<br>"));

      if (data.medicines && data.medicines.length > 0) {
        data.medicines.forEach((medicine, index) => {
          const isExpired =
            medicine.is_expired === 1 || medicine.is_expired === true;

          const cardClass = isExpired
            ? "medicine-card expired"
            : "medicine-card valid";
          const badgeText = isExpired ? "만료" : "복용 가능";
          const badgeClass = isExpired
            ? "status-badge expired"
            : "status-badge valid";

          const expirationDate = medicine.expiration_date || "정보 없음";

          const effect = medicine.efficacy
            ? medicine.efficacy
                .replace(/^이 약은\s*/, "")
                .replace(/에 사용합니다\.?\s*$/u, "")
                .trim()
            : "정보 없음";

          const medicineHtml = `
                    <div class="${cardClass}">
                    <div class="medicine-card-header">
                    <div class="medicine-name">${index + 1}. ${medicine.name}</div>
                    <span class="${badgeClass}">${badgeText}</span>
                    </div>

          ${isExpired ? '<div class="expired-text">유통기한이 만료된 약입니다.</div>' : ""}

          <div class="medicine-info"><strong>성분</strong>: ${medicine.ingredients || "정보 없음"}</div>
          <div class="medicine-info"><strong>효능</strong>: ${effect}</div>
          <div class="medicine-info"><strong>유통기한</strong>: ${expirationDate}</div>
        </div>
      `;

          addMessage("medicine", medicineHtml);
        });
      }

      if (data.messages.length > 1) {
        addMessage(
          "bot",
          data.messages[data.messages.length - 1].replace(/\n/g, "<br>"),
        );
      }
    } else {
      addMessage("bot", "응답을 불러오지 못했습니다.");
    }
  } catch (err) {
    console.error(err);
    addMessage("bot", "약 추천 중 오류가 발생했습니다.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("chatInput");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  });
});
