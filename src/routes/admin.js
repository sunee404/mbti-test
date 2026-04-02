const express = require("express");
const { openDb, all, run, get } = require("../db");

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0451";

function parseIntSafe(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();

  const nextUrl = req.originalUrl || "/admin/questions";
  if (req.method === "GET" || req.method === "HEAD") {
    return res.redirect(`/admin/auth?next=${encodeURIComponent(nextUrl)}`);
  }
  return res.status(401).send("관리자 인증이 필요합니다.");
}

router.get("/auth", (req, res) => {
  const nextUrl = typeof req.query.next === "string" ? req.query.next : "/admin/questions";
  res.render("pages/admin-auth", { title: "관리자 인증", nextUrl });
});

router.post("/auth", (req, res) => {
  const password = String(req.body.password || "");
  const nextUrl = String(req.body.next || "/admin/questions");

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: "비밀번호가 틀렸소." });
  }

  req.session.isAdmin = true;
  return res.json({ ok: true, redirect: nextUrl });
});

router.post("/logout", (req, res) => {
  if (req.session) req.session.isAdmin = false;
  res.redirect("/");
});

router.use("/questions", requireAdmin);

router.get("/questions", async (req, res) => {
  const db = openDb();
  try {
    const questions = await all(
      db,
      `SELECT id, dimension, sort_order, text, option_a, option_b, is_active
       FROM questions
       ORDER BY sort_order ASC`
    );
    res.render("pages/admin-questions", {
      title: "질문 수정",
      questions,
      error: null
    });
  } finally {
    db.close();
  }
});

router.post("/questions/add", async (req, res) => {
  const dimension = String(req.body.dimension || "").toUpperCase();
  const sortOrder = parseIntSafe(req.body.sort_order);
  const text = String(req.body.text || "").trim();
  const optionA = String(req.body.option_a || "").trim();
  const optionB = String(req.body.option_b || "").trim();

  if (!["EI", "SN", "TF", "JP"].includes(dimension) || !sortOrder || !text || !optionA || !optionB) {
    return res.status(400).redirect("/admin/questions");
  }

  const db = openDb();
  try {
    await run(
      db,
      `INSERT INTO questions (dimension, sort_order, text, option_a, option_b, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [dimension, sortOrder, text, optionA, optionB]
    );
    res.redirect("/admin/questions");
  } catch (e) {
    const questions = await all(
      db,
      `SELECT id, dimension, sort_order, text, option_a, option_b, is_active
       FROM questions
       ORDER BY sort_order ASC`
    );
    res.status(400).render("pages/admin-questions", {
      title: "질문 수정",
      questions,
      error: "추가에 실패했어요. (정렬 번호 중복/입력값 확인)"
    });
  } finally {
    db.close();
  }
});

router.post("/questions/:id/update", async (req, res) => {
  const id = parseIntSafe(req.params.id);
  const dimension = String(req.body.dimension || "").toUpperCase();
  const sortOrder = parseIntSafe(req.body.sort_order);
  const text = String(req.body.text || "").trim();
  const optionA = String(req.body.option_a || "").trim();
  const optionB = String(req.body.option_b || "").trim();

  if (!id || !["EI", "SN", "TF", "JP"].includes(dimension) || !sortOrder || !text || !optionA || !optionB) {
    return res.redirect("/admin/questions");
  }

  const db = openDb();
  try {
    await run(
      db,
      `UPDATE questions
       SET dimension = ?, sort_order = ?, text = ?, option_a = ?, option_b = ?
       WHERE id = ?`,
      [dimension, sortOrder, text, optionA, optionB, id]
    );
    res.redirect("/admin/questions");
  } catch (e) {
    const questions = await all(
      db,
      `SELECT id, dimension, sort_order, text, option_a, option_b, is_active
       FROM questions
       ORDER BY sort_order ASC`
    );
    res.status(400).render("pages/admin-questions", {
      title: "질문 수정",
      questions,
      error: "수정에 실패했어요. (정렬 번호 중복/입력값 확인)"
    });
  } finally {
    db.close();
  }
});

router.post("/questions/:id/toggle", async (req, res) => {
  const id = parseIntSafe(req.params.id);
  if (!id) return res.redirect("/admin/questions");

  const db = openDb();
  try {
    const q = await get(db, "SELECT id, is_active FROM questions WHERE id = ?", [id]);
    if (!q) return res.redirect("/admin/questions");
    const next = q.is_active ? 0 : 1;
    await run(db, "UPDATE questions SET is_active = ? WHERE id = ?", [next, id]);
    res.redirect("/admin/questions");
  } finally {
    db.close();
  }
});

router.post("/questions/:id/delete", async (req, res) => {
  const id = parseIntSafe(req.params.id);
  if (!id) return res.redirect("/admin/questions");

  const db = openDb();
  try {
    await run(db, "DELETE FROM questions WHERE id = ?", [id]);
    res.redirect("/admin/questions");
  } finally {
    db.close();
  }
});

module.exports = router;

