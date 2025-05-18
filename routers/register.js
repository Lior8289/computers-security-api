const express = require("express");
const sql = require("mssql");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;

    const missing = [];
    if (!first_name) missing.push("first_name");
    if (!last_name) missing.push("last_name");
    if (!username) missing.push("username");
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: "missing parameters: " + missing.join(","),
      });
    }

    const pool = req.app.locals.dbPool;
    if (!pool) {
      return res
        .status(500)
        .json({ success: false, error: "Database connection failed" });
    }

    const exists = await checkForExistUser(username, email, pool);
    if (exists === null) {
      return res
        .status(500)
        .json({ success: false, error: "Internal DB error" });
    }
    if (exists) {
      return res
        .status(400)
        .json({ success: false, error: "Username or Email already taken" });
    }

    const inserted = await insertToDB(req.body, pool);
    res.status(inserted ? 200 : 500).json({
      success: inserted,
      error_message: inserted ? "" : "Insert failed",
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

async function insertToDB(data, pool) {
  try {
    const sqlText = `
      INSERT INTO Users (user_id, first_name, last_name, username, email, password, salt)
      VALUES ('${data.username + data.email}', '${data.first_name}',
              '${data.last_name}', '${data.username}', '${data.email}',
              '${data.password}', 'dummySalt')
    `;
    await pool.request().query(sqlText);
    return true;
  } catch (err) {
    console.log("❌ Error inserting user:", err);
    return false;
  }
}

async function checkForExistUser(username, email, pool) {
  try {
    const sqlText = `
      SELECT * FROM Users
      WHERE username='${username}' OR email='${email}'
    `;
    const result = await pool.request().query(sqlText);
    return result.recordset.length > 0;
  } catch (err) {
    console.log("❌ Error checking user existence:", err);
    return null;
  }
}

module.exports = router;
