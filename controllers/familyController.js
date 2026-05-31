const db = require("../config/db");
const { promisify } = require("util");

const query = promisify(db.query).bind(db);

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

exports.renderFamilyPage = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.user.user_id;

    const users = await query("SELECT * FROM `USER` WHERE user_id = ?", [userId]);
    const currentUser = users[0];

    if (!currentUser || !currentUser.family_id) {
      return res.render("family/family-group", {
        hasFamily: false,
        inviteCode: null,
        members: [],
      });
    }

    const familyId = currentUser.family_id;

    const inviteCodes = await query(
      "SELECT * FROM INVITE_CODE WHERE family_id = ? ORDER BY created_at DESC LIMIT 1",
      [familyId]
    );

    let inviteCode = inviteCodes[0]?.code;

    if (!inviteCode) {
      inviteCode = generateInviteCode();

      await query(
        "INSERT INTO INVITE_CODE (code, family_id) VALUES (?, ?)",
        [inviteCode, familyId]
      );
    }

    const members = await query(
      "SELECT user_id, name, age, gender FROM `USER` WHERE family_id = ?",
      [familyId]
    );

    res.render("family/family-group", {
      hasFamily: true,
      inviteCode,
      members,
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

    const users = await query("SELECT * FROM `USER` WHERE user_id = ?", [userId]);
    const currentUser = users[0];

    if (currentUser.family_id) {
      return res.redirect("/family");
    }

    const result = await query("INSERT INTO FAMILY () VALUES ()");
    const familyId = result.insertId;

    await query(
      "UPDATE `USER` SET family_id = ? WHERE user_id = ?",
      [familyId, userId]
    );

    const inviteCode = generateInviteCode();

    await query(
      "INSERT INTO INVITE_CODE (code, family_id) VALUES (?, ?)",
      [inviteCode, familyId]
    );

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

    const codes = await query(
      "SELECT * FROM INVITE_CODE WHERE code = ?",
      [inviteCode]
    );

    if (codes.length === 0) {
      return res.send("유효하지 않은 초대코드입니다.");
    }

    const familyId = codes[0].family_id;

    await query(
      "UPDATE `USER` SET family_id = ? WHERE user_id = ?",
      [familyId, userId]
    );

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

    await query(
      "UPDATE `USER` SET family_id = NULL WHERE user_id = ?",
      [userId]
    );

    res.redirect("/family");
  } catch (err) {
    console.error(err);
    res.status(500).send("가족그룹 탈퇴 실패");
  }
};