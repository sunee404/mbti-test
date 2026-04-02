const express = require("express");
const { openDb, all, run } = require("../db");
const { scoreFromAnswers, typeMeta } = require("../mbti");

const router = express.Router();

async function fetchActiveQuestions() {
  const db = openDb();
  try {
    return await all(
      db,
      `SELECT id, dimension, sort_order, text, option_a, option_b
       FROM questions
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    );
  } finally {
    db.close();
  }
}

router.get("/", (req, res) => {
  res.render("pages/test-name", {
    title: "MBTI 테스트 시작",
    userName: req.session.userName || "",
    error: null
  });
});

router.post("/start", async (req, res) => {
  const userName = String(req.body.userName || "").trim();
  if (!userName) {
    return res.status(400).render("pages/test-name", {
      title: "MBTI 테스트 시작",
      userName: "",
      error: "이름을 입력해 주세요."
    });
  }

  req.session.userName = userName;
  req.session.startedAt = new Date().toISOString();
  req.session.answersByQuestionId = {};
  req.session.resultId = null;

  const questions = await fetchActiveQuestions();
  if (!questions.length) {
    return res.status(400).render("pages/test-name", {
      title: "MBTI 테스트 시작",
      userName,
      error: "활성화된 질문이 없어요. '질문 수정'에서 질문을 추가해 주세요."
    });
  }

  res.redirect("/test/q/1");
});

router.post("/restart", (req, res) => {
  req.session.answersByQuestionId = {};
  req.session.resultId = null;
  req.session.startedAt = new Date().toISOString();
  res.redirect("/test/q/1");
});

router.get("/q/:idx", async (req, res) => {
  if (!req.session.userName) return res.redirect("/test");

  const idx = Number(req.params.idx);
  if (!Number.isFinite(idx) || idx < 1) return res.redirect("/test/q/1");

  const questions = await fetchActiveQuestions();
  if (!questions.length) return res.redirect("/test");

  if (idx > questions.length) return res.redirect("/test/result");

  const q = questions[idx - 1];
  const selected = (req.session.answersByQuestionId || {})[String(q.id)] || null;

  res.render("pages/test-question", {
    title: `질문 ${idx}`,
    idx,
    total: questions.length,
    question: q,
    selected,
    userName: req.session.userName
  });
});

router.post("/q/:idx", async (req, res) => {
  if (!req.session.userName) return res.redirect("/test");

  const idx = Number(req.params.idx);
  if (!Number.isFinite(idx) || idx < 1) return res.redirect("/test/q/1");

  const questions = await fetchActiveQuestions();
  if (!questions.length) return res.redirect("/test");
  if (idx > questions.length) return res.redirect("/test/result");

  const q = questions[idx - 1];
  const answer = String(req.body.answer || "").toUpperCase();
  if (answer !== "A" && answer !== "B") {
    return res.status(400).render("pages/test-question", {
      title: `질문 ${idx}`,
      idx,
      total: questions.length,
      question: q,
      selected: null,
      userName: req.session.userName,
      error: "A 또는 B 중 하나를 선택해 주세요."
    });
  }

  if (!req.session.answersByQuestionId) req.session.answersByQuestionId = {};
  req.session.answersByQuestionId[String(q.id)] = answer;

  const next = idx + 1;
  if (next > questions.length) return res.redirect("/test/result");
  res.redirect(`/test/q/${next}`);
});

router.get("/result", async (req, res) => {
  if (!req.session.userName) return res.redirect("/test");

  const questions = await fetchActiveQuestions();
  const answers = req.session.answersByQuestionId || {};
  const { mbti, scores, letters } = scoreFromAnswers(questions, answers);
  const meta = typeMeta(mbti);

  let savedResultId = req.session.resultId || null;
  if (!savedResultId) {
    const db = openDb();
    try {
      const measuredAt = new Date().toISOString();
      const detailJson = JSON.stringify({ scores, letters, answersCount: Object.keys(answers).length });
      const r = await run(
        db,
        `INSERT INTO results (user_name, measured_at, mbti, detail_json)
         VALUES (?, ?, ?, ?)`,
        [req.session.userName, measuredAt, mbti, detailJson]
      );
      savedResultId = r.lastID;
      req.session.resultId = savedResultId;
    } finally {
      db.close();
    }
  }

  res.render("pages/test-result", {
    title: "결과",
    userName: req.session.userName,
    mbti,
    meta,
    scores,
    resultId: savedResultId
  });
});

module.exports = router;

