const express = require("express");
const { typeMeta } = require("../mbti");

const router = express.Router();

const TYPES = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ"
];

router.get("/", (req, res) => {
  const items = TYPES.map((t) => ({ mbti: t, ...typeMeta(t) }));
  res.render("pages/types", { title: "성격 유형", items });
});

module.exports = router;

