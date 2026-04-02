const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/home", {
    title: "MBTI 테스트",
    userName: req.session.userName || ""
  });
});

module.exports = router;

