const db = require("../config/db");

exports.findOrCreateUser = async (profile) => {
  return new Promise((resolve, reject) => {
    const googleId = profile.id;
    const name = profile.displayName || "Google 사용자";
    const email = profile.emails?.[0]?.value || null;
    const profileImage =
      profile.photos?.[0]?.value ||
      profile._json?.picture ||
      null;

    const findUserQuery = "SELECT * FROM `USER` WHERE google_id = ?";

    db.query(findUserQuery, [googleId], (err, results) => {
      if (err) {
        return reject(err);
      }

      if (results.length > 0) {
        const updateUserQuery = `
          UPDATE \`USER\`
          SET name = ?, email = ?, profile_image = ?
          WHERE google_id = ?
        `;

        db.query(
          updateUserQuery,
          [name, email, profileImage, googleId],
          (err) => {
            if (err) {
              return reject(err);
            }

            return resolve({
              ...results[0],
              name,
              email,
              profile_image: profileImage,
            });
          }
        );

        return;
      }

      const insertUserQuery = `
        INSERT INTO \`USER\`
        (
          google_id,
          provider,
          name,
          email,
          profile_image,
          password
        )
        VALUES (?, 'google', ?, ?, ?, 'GOOGLE_LOGIN')
      `;

      db.query(
        insertUserQuery,
        [googleId, name, email, profileImage],
        (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve({
            user_id: result.insertId,
            google_id: googleId,
            provider: "google",
            name,
            email,
            profile_image: profileImage,
            password: "GOOGLE_LOGIN",
          });
        }
      );
    });
  });
};
