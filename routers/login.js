const sql = require("mssql");
const express = require("express");
const { getPool } = require("../db/dbUtils.js");

const router = express.Router();

router.post("/", async (req, res) => {
  // אין שום ולידציה – כל-הקלט עובר ישירות ל-SQL
  const { username, password } = req.body;
  try {
    const pool = req.app.locals.dbPool;
    const query = `
      SELECT user_id, username, email, first_name, last_name, password, salt
      FROM   Users
      WHERE  username='${username}'
        AND  password='${password}'
    `; // ← הדבקה גולמית של קלט המשתמש
    const result = await pool.request().query(query);

    return res.json({ success: true, users: result.recordset });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "server error" });
  }
});

module.exports = router;
