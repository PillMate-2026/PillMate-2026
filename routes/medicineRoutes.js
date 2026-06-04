const pool = require("../db/connection");

const {
  searchMedicine,
  searchIngredients,
} = require("../services/medicineApiService");

const { extractTextFromImage } = require("../services/ocrService");

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

router.get("/autocomplete", async (req, res) => {
  try {
    const keyword = req.query.keyword;

    const result = await searchMedicine(keyword);

    res.json(result.body.items || []);
  } catch (error) {
    console.error(error);

    res.json([]);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

router.get("/add", (req, res) => {
  res.render("medicines/register-ocr", {
    activeMenu: "add",
    pageTitle: "약 등록하기",
    pageIcon: "plus",
    pageCss: "medicine",
  });
});

router.get("/manual", (req, res) => {
  res.render("medicines/register-text", {
    activeMenu: "add",
    pageTitle: "약 등록하기",
    pageIcon: "plus",
    pageCss: "medicine",
    medicineName: "",
    medicineCandidates: [],
  });
});

router.post("/ocr", upload.single("medicineImage"), async (req, res) => {
  try {
    console.log(req.file);

    const extractedText = await extractTextFromImage(req.file.path);

    console.log(extractedText);

    /* OCR 결과 줄 단위 분리 */
    const lines = extractedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    /* 약 이름 후보 찾기 */
    const candidates = lines.filter((line) => {
      return (
        line.length >= 2 &&
        !line.includes("주의") &&
        !line.includes("일반의약품") &&
        !line.includes("품목기준코드")
      );
    });

    console.log("후보군:", candidates);

    let medicineName = candidates[0] || "";
    let medicineCandidates = [];

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.replace(/\s/g, "");

      const result = await searchMedicine(normalizedCandidate);

      console.log(normalizedCandidate, result.body.totalCount);

      if (result.body.totalCount > 0) {
        medicineName = normalizedCandidate;

        medicineCandidates = result.body.items;
        console.log(result.body.items[0]);

        break;
      }
    }

    res.render("medicines/register-text", {
      activeMenu: "add",
      pageTitle: "약 등록하기",
      pageIcon: "plus",
      pageCss: "medicine",
      medicineName,
      medicineCandidates,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send("OCR 처리 실패");
  }
});
router.post("/register", async (req, res) => {
  try {
    const {
      medicineName,
      expiryDate,
      itemSeq,
      entpName,
      itemImage,
      efficacy,
      useMethod,
      precaution,
      interaction,
      sideEffect,
      selectedMedicineName,
    } = req.body;

    const saveMedicineName = selectedMedicineName || medicineName;

    if (!saveMedicineName || !expiryDate || !itemSeq) {
      return res
        .status(400)
        .send("약 이름, 유통기한, 의약품 선택이 필요합니다.");
    }

    const userId = req.user.user_id;
    const familyId = req.user.family_id;

    const medicineUserId = familyId ? null : userId;
    const medicineFamilyId = familyId || null;

    const [medicineResult] = await pool.query(
      `
  INSERT INTO MEDICINE
  (
    user_id,
    family_id,
    name,
    expiration_date,
    item_seq,
    entp_name,
    item_image,
    efficacy,
    use_method,
    precaution,
    interaction,
    side_effect
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      [
        medicineUserId,
        medicineFamilyId,
        saveMedicineName,
        expiryDate,
        itemSeq,
        entpName,
        itemImage,
        efficacy,
        useMethod,
        precaution,
        interaction,
        sideEffect,
      ],
    );

    // 주성분 api
    const medicineId = medicineResult.insertId;

    try {
      const ingredientResult = await searchIngredients(saveMedicineName);

      const items = ingredientResult?.body?.items || [];

      for (const item of items) {
        const ingredientName = item.MTRAL_NM || item.mtralNm;

        if (!ingredientName) continue;

        await pool.query(
          `
      INSERT IGNORE INTO INGREDIENT (name)
      VALUES (?)
      `,
          [ingredientName],
        );

        const [ingredientRows] = await pool.query(
          `
      SELECT ingredient_id
      FROM INGREDIENT
      WHERE name = ?
      `,
          [ingredientName],
        );

        if (ingredientRows.length === 0) continue;

        const ingredientId = ingredientRows[0].ingredient_id;

        await pool.query(
          `
      INSERT IGNORE INTO MEDICINE_INGREDIENT
      (medicine_id, ingredient_id)
      VALUES (?, ?)
      `,
          [medicineId, ingredientId],
        );
      }
    } catch (ingredientError) {
      console.error("주성분 저장 실패:", ingredientError);
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);

    res.status(500).send("등록 실패");
  }
});
module.exports = router;
