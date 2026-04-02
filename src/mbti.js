const DIMENSIONS = /** @type {const} */ (["EI", "SN", "TF", "JP"]);

function normalizeAnswer(a) {
  if (a === "A" || a === "a") return "A";
  if (a === "B" || a === "b") return "B";
  return null;
}

function scoreFromAnswers(questions, answersByQuestionId) {
  const scores = {
    EI: { A: 0, B: 0 },
    SN: { A: 0, B: 0 },
    TF: { A: 0, B: 0 },
    JP: { A: 0, B: 0 }
  };

  for (const q of questions) {
    const raw = answersByQuestionId[String(q.id)];
    const ans = normalizeAnswer(raw);
    if (!ans) continue;
    scores[q.dimension][ans] += 1;
  }

  const letters = {
    EI: scores.EI.A >= scores.EI.B ? "E" : "I",
    SN: scores.SN.A >= scores.SN.B ? "S" : "N",
    TF: scores.TF.A >= scores.TF.B ? "T" : "F",
    JP: scores.JP.A >= scores.JP.B ? "J" : "P"
  };

  const mbti = `${letters.EI}${letters.SN}${letters.TF}${letters.JP}`;
  return { mbti, scores, letters };
}

function typeMeta(mbti) {
  const key = String(mbti || "").toUpperCase();
  const META = {
    ISTJ: { label: "현실주의 관리자", color: "#4B5563", vibe: "차분하고 책임감 있는 실무형" },
    ISFJ: { label: "헌신적 수호자", color: "#14B8A6", vibe: "다정하고 세심한 보호자" },
    INFJ: { label: "통찰력 있는 조언자", color: "#8B5CF6", vibe: "깊이 있는 비전과 공감" },
    INTJ: { label: "전략가", color: "#111827", vibe: "목표 지향적, 설계하는 리더" },
    ISTP: { label: "만능 재주꾼", color: "#0EA5E9", vibe: "유연하고 문제 해결에 강함" },
    ISFP: { label: "따뜻한 예술가", color: "#F59E0B", vibe: "감각적이고 온화한 자유인" },
    INFP: { label: "이상주의 중재자", color: "#22C55E", vibe: "진정성과 가치 중심" },
    INTP: { label: "논리적인 사색가", color: "#64748B", vibe: "호기심 많고 분석적인 탐구자" },
    ESTP: { label: "에너지 넘치는 활동가", color: "#FB7185", vibe: "즉흥적이고 추진력 있는 도전가" },
    ESFP: { label: "자유로운 연예인", color: "#F97316", vibe: "밝고 즐거운 분위기 메이커" },
    ENFP: { label: "열정적 아이디어 뱅크", color: "#84CC16", vibe: "호기심과 상상력의 폭발" },
    ENTP: { label: "재치 있는 발명가", color: "#38BDF8", vibe: "토론과 발상 전환의 고수" },
    ESTJ: { label: "현실적 통솔자", color: "#DC2626", vibe: "정리정돈, 리딩에 강함" },
    ESFJ: { label: "사교적 케어리더", color: "#EC4899", vibe: "조율과 배려의 달인" },
    ENFJ: { label: "따뜻한 리더", color: "#A855F7", vibe: "사람을 이끄는 공감형 리더" },
    ENTJ: { label: "목표 지향 통솔자", color: "#EF4444", vibe: "카리스마 있고 추진력 있는 리더" }
  };
  return META[key] || { label: "알 수 없는 유형", color: "#94A3B8", vibe: "다시 측정해보세요" };
}

module.exports = {
  DIMENSIONS,
  normalizeAnswer,
  scoreFromAnswers,
  typeMeta
};

