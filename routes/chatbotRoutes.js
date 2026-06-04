const express = require("express");
const router = express.Router();
const db = require("../db/connection");

function formatDate(date) {
  if (!date) return "정보 없음";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

router.get("/guide", (req, res) => {
  res.render("chatbot");
});

router.post("/chatbot/recommend", async (req, res) => {
  try {
    const { userText } = req.body;

    if (!req.user) {
      return res.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    const userId = req.user.user_id;
    const familyId = req.user.family_id;

    if (!userText) {
      return res.status(400).json({
        message: "사용자 입력이 필요합니다.",
      });
    }

    // 1.Ollama로 증상 키워드 추출
    const prompt = `
너는 증상 분류기다.
아래 사용자 문장을 읽고 가능한 증상 목록 중 해당되는 증상명만 고른다.

가능한 증상:
[
  "두통", "발열", "근육통", "관절통", "치통", "생리통", "인후통",
  "콧물", "코막힘", "재채기", "기침", "가래",
  "알레르기", "비염",
  "소화불량", "속쓰림", "위산과다", "복통", "설사", "변비",
  "구역", "구토", "멀미", "복부팽만", "가스참",
  "피부가려움", "두드러기", "습진", "상처", "화상",
  "눈가려움", "충혈", "안구건조",
  "피로", "구내염"
]

반드시 위 증상 중에서만 선택하라.
해당 증상이 없으면 빈 배열([])을 출력하라.
반드시 JSON 배열만 출력한다.
설명, 문장, 코드, 마크다운은 절대 출력하지 않는다.

분류 규칙:
- 머리 아픔, 머리아파, 머리가 아파, 지끈거림, 편두통 → 두통
- 열, 발열, 미열, 몸이 뜨거움, 감기기운, 감기 기운, 으슬으슬, 오한 → 발열
- 몸살, 몸이 쑤심, 온몸이 아픔, 근육이 아픔 → 근육통
- 관절이 아픔, 무릎 아픔, 손목 아픔, 어깨 관절 통증 → 관절통
- 이 아픔, 이가 아픔, 치아 통증, 잇몸 아픔 → 치통
- 생리통, 아랫배 아픔, 생리할 때 배 아픔 → 생리통
- 목아픔, 목이 아픔, 목 따가움, 목 칼칼함, 침 삼키기 힘듦 → 인후통

- 콧물, 코물이 나옴, 코가 흐름, 맑은 콧물 → 콧물
- 코막힘, 코가 막힘, 코가 답답함, 코로 숨쉬기 힘듦 → 코막힘
- 재채기, 계속 재채기함 → 재채기
- 기침, 콜록거림, 마른기침 → 기침
- 가래, 가래 낌, 목에 가래 있음 → 가래
- 알레르기, 알러지, 알레르기 증상 → 알레르기
- 비염, 코 비염, 알레르기성 비염 → 비염

- 소화 안 됨, 체함, 체한 것 같음, 더부룩함 → 소화불량
- 속쓰림, 속이 쓰림, 명치가 쓰림 → 속쓰림
- 위산, 신물 올라옴, 신트림 → 위산과다
- 배아픔, 배가 아픔, 복통 → 복통
- 설사, 묽은 변, 배탈 → 설사
- 변비, 변이 안 나옴, 화장실 못 감 → 변비
- 메스꺼움, 울렁거림, 토할 것 같음 → 구역
- 토함, 구토, 토했음 → 구토
- 멀미, 차멀미, 배멀미 → 멀미
- 배에 가스 참, 배가 빵빵함, 복부팽만 → 복부팽만
- 가스참, 방귀가 많이 나옴 → 가스참

- 피부가 가려움, 몸이 가려움 → 피부가려움
- 두드러기, 피부가 올라옴 → 두드러기
- 습진, 피부염 → 습진
- 상처, 까짐, 베임 → 상처
- 화상, 데임 → 화상

- 눈 가려움, 눈이 간지러움 → 눈가려움
- 눈 충혈, 눈이 빨개짐 → 충혈
- 눈 건조함, 눈이 뻑뻑함 → 안구건조

- 피곤함, 피로, 기운 없음, 몸이 무거움 → 피로
- 입안 헐음, 입병, 구내염 → 구내염

중요:
- 인사, 욕설, 잡담은 [] 출력
- 문장에 증상 단서가 없으면 [] 출력
- 목록에 없는 증상은 출력하지 않음
- 여러 증상이 있으면 여러 개 출력
- 감기기운/감기 기운은 발열로 분류
- 어지러움, 현기증은 목록에 없으므로 [] 출력

예시:
사용자 문장: 감기기운 있는 것 같아
["발열"]

사용자 문장: 목이 아프고 콧물이 나
["인후통", "콧물"]

사용자 문장: 배가 아프고 설사해
["복통", "설사"]

사용자 문장: 속이 쓰리고 신물이 올라와
["속쓰림", "위산과다"]

사용자 문장: 눈이 뻑뻑하고 충혈됐어
["안구건조", "충혈"]

사용자 문장: 안녕
[]

사용자 문장: ${userText}
`;
    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:3b-instruct",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: userText,
          },
        ],
        stream: false,
        options: {
          temperature: 0,
          num_predict: 30,
        },
      }),
    });

    const ollamaData = await ollamaResponse.json();

    let symptoms = [];

    try {
      const raw = ollamaData.message.content.trim();
      const match = raw.match(/\[[\s\S]*?\]/);

      if (match) {
        const parsed = JSON.parse(match[0]);

        if (Array.isArray(parsed)) {
          symptoms = parsed;
        }
      }
    } catch (e) {
      symptoms = [];
    }

    if (symptoms.length === 0) {
      return res.json({
        inputSymptoms: [],
        count: 0,
        medicines: [],
        messages: [
          "증상을 잘 찾지 못했어요. 예: 두통, 발열, 콧물처럼 입력해 주세요.",
        ],
      });
    }

    // 2. 추출된 symptom로 DB 조회
    const whereOwner = familyId
      ? "m.family_id = ?"
      : "m.user_id = ?";

    const ownerId = familyId || userId;

    const [rows] = await db.query(
      `
      SELECT DISTINCT
        m.medicine_id,
        m.name,
        m.expiration_date,
        CASE
            WHEN m.expiration_date < CURDATE()
            THEN true
            ELSE false
        END AS is_expired,
        m.efficacy,
        GROUP_CONCAT(DISTINCT all_i.name SEPARATOR ', ') AS ingredients
      FROM SYMPTOM s
      JOIN INGREDIENT_SYMPTOM ins 
        ON s.symptom_id = ins.symptom_id
      JOIN INGREDIENT i 
        ON ins.ingredient_id = i.ingredient_id
      JOIN MEDICINE_INGREDIENT mi 
        ON i.ingredient_id = mi.ingredient_id
      JOIN MEDICINE m 
        ON mi.medicine_id = m.medicine_id

       LEFT JOIN MEDICINE_INGREDIENT mi_all
          ON m.medicine_id = mi_all.medicine_id
        LEFT JOIN INGREDIENT all_i
          ON mi_all.ingredient_id = all_i.ingredient_id

      WHERE s.name IN (?)
         AND ${whereOwner}
      GROUP BY 
        m.medicine_id,
        m.name,
        m.expiration_date,
        m.efficacy
      ORDER BY m.expiration_date ASC
      LIMIT 5
      `,
      [symptoms, ownerId],
    );

    // 3. 답변 직접 생성
    const messages = [];

    if (rows.length === 0) {
      messages.push(
        `입력하신 증상: ${symptoms.join(", ")}\n\n해당 증상에 맞는 약을 내 약장에서 찾지 못했어요.`,
      );
    } else {
      const allExpired =
        rows.length > 0 && rows.every((medicine) => medicine.is_expired);

      if (allExpired) {
        messages.push(
          `입력하신 증상: ${symptoms.join(", ")}\n\n관련 약의 유통기한이 모두 만료되었어요.\n폐기 후 새 약을 준비해 주세요.`,
        );
      } else {
        messages.push(
          `입력하신 증상: ${symptoms.join(", ")}\n\n내 약장에서 찾은 관련 약이에요.`,
        );
      }
    }

    messages.push(
      "※ 증상 및 약 정보를 바탕으로 제공되는 참고용 결과입니다. 복용 전 의사 또는 약사와 상담해 주세요.",
    );

    const medicines = rows.map((medicine) => ({
      ...medicine,
      expiration_date: formatDate(medicine.expiration_date),
    }));

    res.json({
      inputSymptoms: symptoms,
      count: medicines.length,
      medicines,
      messages,
    });
  } catch (err) {
    console.error("챗봇 약 추천 조회 오류:", err);
    res.status(500).json({
      message: "챗봇 약 추천 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
