const db = require("../config/db");

exports.findOrCreateUser = async (profile) => {
  return new Promise((resolve, reject) => {
    const googleId = profile.id;
    const name = profile.displayName || "Google 사용자";

    const findUserQuery = "SELECT * FROM `USER` WHERE google_id = ?";

    db.query(findUserQuery, [googleId], (err, results) => {
      if (err) {
        return reject(err);
      }

      if (results.length > 0) {
        return resolve(results[0]);
      }

      const insertUserQuery = `
        INSERT INTO \`USER\`
        (
          google_id,
          provider,
          name,
          password
        )
        VALUES (?, 'google', ?, 'GOOGLE_LOGIN')
      `;

      db.query(insertUserQuery, [googleId, name], (err, result) => {
        if (err) {
          return reject(err);
        }

        resolve({
          user_id: result.insertId,
          google_id: googleId,
          provider: "google",
          name,
          password: "GOOGLE_LOGIN",
        });
      });
    });
  });
};