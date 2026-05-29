const db = require("../config/db");

exports.findOrCreateUser = async (profile) => {
  return new Promise((resolve, reject) => {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const profileImage = profile.photos[0].value;

    const findUserQuery =
      "SELECT * FROM `USER` WHERE google_id = ?";

    db.query(findUserQuery, [googleId], (err, results) => {
      if (err) {
        return reject(err);
      }

      if (results.length > 0) {
        return resolve(results[0]);
      }

      const insertUserQuery = `
        INSERT INTO \`USER\`
        (google_id, email, name, profile_image, provider)
        VALUES (?, ?, ?, ?, 'google')
      `;

      db.query(
        insertUserQuery,
        [googleId, email, name, profileImage],
        (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve({
            user_id: result.insertId,
            google_id: googleId,
            email,
            name,
            profile_image: profileImage,
            provider: "google",
          });
        }
      );
    });
  });
};