exports.renderFamilyPage = (req, res) => {
  res.render("family/family-group", {
    hasFamily: false,
    inviteCode: null,
    members: [],
  });
};