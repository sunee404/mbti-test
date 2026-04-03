const express = require("express");
const { openDb, all, get } = require("../db");
const { typeMeta } = require("../mbti");

const router = express.Router();

function formatYmdDot(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike || "");

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !day) return String(dateLike || "");
  return `${y}.${m}.${day}`;
}

function parseIntSafe(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

router.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const db = openDb();
  try {
    const params = [];
    let where = "";
    if (q) {
      where = "WHERE user_name LIKE ?";
      params.push(`%${q}%`);
    }

    const rows = await all(
      db,
      `SELECT id, user_name, measured_at, mbti
       FROM results
       ${where}
       ORDER BY id DESC
       LIMIT 50`,
      params
    );

    res.render("pages/results", {
      title: "결과 보기",
      q,
      rows: rows.map((r) => ({
        ...r,
        measured_at_label: formatYmdDot(r.measured_at),
        meta: typeMeta(r.mbti)
      }))
    });
  } finally {
    db.close();
  }
});

router.get("/:id", async (req, res) => {
  const id = parseIntSafe(req.params.id);
  if (!id) return res.redirect("/results");

  const db = openDb();
  try {
    const row = await get(
      db,
      `SELECT id, user_name, measured_at, mbti, detail_json
       FROM results
       WHERE id = ?`,
      [id]
    );
    if (!row) return res.redirect("/results");
    let detail = null;
    try {
      detail = row.detail_json ? JSON.parse(row.detail_json) : null;
    } catch {
      detail = null;
    }
    res.render("pages/result-detail", {
      title: `결과 #${row.id}`,
      row: { ...row, measured_at_label: formatYmdDot(row.measured_at) },
      meta: typeMeta(row.mbti),
      detail
    });
  } finally {
    db.close();
  }
});

module.exports = router;

