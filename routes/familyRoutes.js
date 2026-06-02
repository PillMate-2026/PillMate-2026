const express = require("express");
const router = express.Router();

const familyController = require("../controllers/familyController");

router.get("/", familyController.renderFamilyPage);
router.post("/create", familyController.createFamily);
router.post("/join", familyController.joinFamily);
router.post("/refresh-code", familyController.refreshInviteCode);

router.post("/leave", familyController.leaveFamily);

module.exports = router;