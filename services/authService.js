const db = require("../config/db");

exports.findOrCreateUser = async (profile) => {
  return new Promise((resolve, reject) => {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const profileImage = profile.photos[0].value;

    // 기존 사용자 조회
    const findUserQuery =
      "SELECT * FROM users WHERE google_id = ?";

    db.query(findUserQuery, [googleId], (err, results) => {
      if (err) {
        return reject(err);
      }

      // 이미 존재하는 사용자
      if (results.length > 0) {
        return resolve(results[0]);
      }

      // 새 사용자 생성
      const insertUserQuery = `
        INSERT INTO users
        (google_id, email, name, profile_image)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertUserQuery,
        [googleId, email, name, profileImage],
        (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve({
            id: result.insertId,
            google_id: googleId,
            email,
            name,
            profile_image: profileImage,
          });
        }
      );
    });
  });
};