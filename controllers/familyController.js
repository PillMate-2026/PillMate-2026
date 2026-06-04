const db = require("../config/db");
const { promisify } = require("util");

const query = promisify(db.query).bind(db);

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getKstTime(date) {
  return new Date(date).getTime() + 9 * 60 * 60 * 1000;
}

function getInviteExpireText(createdAt) {
  const createdTime = getKstTime(createdAt);
  const expireTime = createdTime + 24 * 60 * 60 * 1000;
  const diff = expireTime - Date.now();

  if (diff <= 0) {
    return "만료되었습니다";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}동안 유효합니다`;
}

async function movePersonalMedicinesToFamily(userId, familyId) {
  const medicines = await query(
    `
    SELECT *
    FROM MEDICINE
    WHERE user_id = ?
    `,
    [userId],
  );

  for (const medicine of medicines) {
    const result = await query(
      `
    INSERT INTO MEDICINE
    (
      family_id,
      name,
      expiration_date,
      created_at,
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
        familyId,
        medicine.name,
        medicine.expiration_date,
        medicine.created_at,
        medicine.item_seq,
        medicine.entp_name,
        medicine.item_image,
        medicine.efficacy,
        medicine.use_method,
        medicine.precaution,
        medicine.interaction,
        medicine.side_effect,
      ],
    );

    const newMedicineId = result.insertId;

    await query(
      `
      INSERT INTO MEDICINE_INGREDIENT (medicine_id, ingredient_id)
      SELECT ?, ingredient_id
      FROM MEDICINE_INGREDIENT
      WHERE medicine_id = ?
      `,
      [newMedicineId, medicine.medicine_id],
    );
  }

  await query("DELETE FROM NOTIFICATION WHERE user_id = ?", [userId]);
  await query("DELETE FROM MEDICINE WHERE user_id = ?", [userId]);
}

exports.renderFamilyPage = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;

    const users = await query("SELECT * FROM `USER` WHERE user_id = ?", [
      userId,
    ]);
    const currentUser = users[0];

    if (!currentUser || !currentUser.family_id) {
      req.user.family_id = null;

      return res.render("family/family-group", {
        hasFamily: false,
        inviteCode: null,
        inviteExpireText: null,
        inviteExpireAt: null,
        members: [],
        error: null,
      });
    }

    req.user.family_id = currentUser.family_id;

    const familyId = currentUser.family_id;

    let inviteCodes = await query(
      "SELECT * FROM INVITE_CODE WHERE family_id = ? ORDER BY created_at DESC LIMIT 1",
      [familyId],
    );

    let inviteCode = inviteCodes[0]?.code;
    let inviteCreatedAt = inviteCodes[0]?.created_at;

    const isExpired =
      inviteCreatedAt &&
      Date.now() - getKstTime(inviteCreatedAt) >= 24 * 60 * 60 * 1000;

    if (!inviteCode || isExpired) {
      await query("DELETE FROM INVITE_CODE WHERE family_id = ?", [familyId]);

      inviteCode = generateInviteCode();

      await query("INSERT INTO INVITE_CODE (code, family_id) VALUES (?, ?)", [
        inviteCode,
        familyId,
      ]);

      inviteCodes = await query(
        "SELECT * FROM INVITE_CODE WHERE family_id = ? ORDER BY created_at DESC LIMIT 1",
        [familyId],
      );

      inviteCreatedAt = inviteCodes[0].created_at;
    }

    const members = await query(
      "SELECT user_id, name, age, gender, profile_image FROM `USER` WHERE family_id = ?",
      [familyId],
    );

    res.render("family/family-group", {
      hasFamily: true,
      inviteCode,
      inviteExpireText: getInviteExpireText(inviteCreatedAt),
      inviteExpireAt: new Date(
        getKstTime(inviteCreatedAt) + 24 * 60 * 60 * 1000,
      ).toISOString(),
      members,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("가족그룹 페이지 오류");
  }
};

exports.createFamily = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;

    const users = await query("SELECT * FROM `USER` WHERE user_id = ?", [
      userId,
    ]);
    const currentUser = users[0];

    if (currentUser.family_id) {
      req.user.family_id = currentUser.family_id;
      return res.redirect("/family");
    }

    const result = await query("INSERT INTO FAMILY () VALUES ()");
    const familyId = result.insertId;

    await movePersonalMedicinesToFamily(userId, familyId);

    await query("UPDATE `USER` SET family_id = ? WHERE user_id = ?", [
      familyId,
      userId,
    ]);

    req.user.family_id = familyId;

    const inviteCode = generateInviteCode();

    await query("INSERT INTO INVITE_CODE (code, family_id) VALUES (?, ?)", [
      inviteCode,
      familyId,
    ]);

    res.redirect("/family");
  } catch (err) {
    console.error(err);
    res.status(500).send("가족그룹 생성 실패");
  }
};

exports.joinFamily = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;
    const { inviteCode } = req.body;

    const codes = await query("SELECT * FROM INVITE_CODE WHERE code = ?", [
      inviteCode,
    ]);

    if (codes.length === 0) {
      return res.render("family/family-group", {
        hasFamily: false,
        inviteCode: null,
        inviteExpireText: null,
        inviteExpireAt: null,
        members: [],
        error: "유효하지 않은 초대코드입니다.",
      });
    }

    const createdAt = codes[0].created_at;

    const isExpired = Date.now() - getKstTime(createdAt) >= 24 * 60 * 60 * 1000;

    if (isExpired) {
      return res.render("family/family-group", {
        hasFamily: false,
        inviteCode: null,
        inviteExpireText: null,
        inviteExpireAt: null,
        members: [],
        error: "유효하지 않은 초대코드입니다.",
      });
    }

    const familyId = codes[0].family_id;

    await movePersonalMedicinesToFamily(userId, familyId);

    await query("UPDATE `USER` SET family_id = ? WHERE user_id = ?", [
      familyId,
      userId,
    ]);

    req.user.family_id = familyId;

    res.redirect("/family");
  } catch (err) {
    console.error(err);
    res.status(500).send("가족그룹 참여 실패");
  }
};

exports.leaveFamily = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;

    await query("UPDATE `USER` SET family_id = NULL WHERE user_id = ?", [
      userId,
    ]);

    req.user.family_id = null;

    res.redirect("/family");
  } catch (err) {
    console.error(err);
    res.status(500).send("가족그룹 탈퇴 실패");
  }
};

exports.refreshInviteCode = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;

    const users = await query("SELECT * FROM `USER` WHERE user_id = ?", [
      userId,
    ]);
    const currentUser = users[0];

    if (!currentUser || !currentUser.family_id) {
      req.user.family_id = null;
      return res.redirect("/family");
    }

    req.user.family_id = currentUser.family_id;

    const familyId = currentUser.family_id;
    const newCode = generateInviteCode();

    await query("DELETE FROM INVITE_CODE WHERE family_id = ?", [familyId]);

    await query("INSERT INTO INVITE_CODE (code, family_id) VALUES (?, ?)", [
      newCode,
      familyId,
    ]);

    res.redirect("/family");
  } catch (err) {
    console.error(err);
    res.status(500).send("초대코드 새로고침 실패");
  }
};
