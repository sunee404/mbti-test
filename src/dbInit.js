const fs = require("fs");
const path = require("path");
const { openDb, run, get } = require("./db");

const DATA_DIR = path.join(__dirname, "..", "data");

const SEED_QUESTIONS = [
  // EI
  {
    dimension: "EI",
    sort_order: 1,
    text: "모임에서 나는 보통…",
    option_a: "먼저 말을 걸고 분위기를 만든다 (E)",
    option_b: "상대가 다가오면 자연스럽게 섞인다 (I)"
  },
  {
    dimension: "EI",
    sort_order: 2,
    text: "에너지를 채우는 방법은…",
    option_a: "사람들과 이야기하며 충전한다 (E)",
    option_b: "혼자만의 시간이 필요하다 (I)"
  },
  {
    dimension: "EI",
    sort_order: 3,
    text: "낯선 장소에서 나는…",
    option_a: "먼저 탐색하고 바로 행동한다 (E)",
    option_b: "관찰하며 천천히 적응한다 (I)"
  },
  {
    dimension: "EI",
    sort_order: 4,
    text: "대화 스타일은…",
    option_a: "생각이 떠오르면 바로 말한다 (E)",
    option_b: "정리된 뒤에 말하는 편이다 (I)"
  },

  // SN
  {
    dimension: "SN",
    sort_order: 5,
    text: "설명을 들을 때 더 끌리는 건…",
    option_a: "구체적인 예시와 현실적인 정보 (S)",
    option_b: "큰 그림과 가능성, 의미 (N)"
  },
  {
    dimension: "SN",
    sort_order: 6,
    text: "일을 시작할 때 나는…",
    option_a: "지금 필요한 것부터 착착 한다 (S)",
    option_b: "어떤 방향이 좋을지 상상한다 (N)"
  },
  {
    dimension: "SN",
    sort_order: 7,
    text: "친구의 고민을 들을 때 나는…",
    option_a: "현실적인 해결책을 같이 찾는다 (S)",
    option_b: "마음의 의미와 가능성을 함께 본다 (N)"
  },
  {
    dimension: "SN",
    sort_order: 8,
    text: "내가 기억하는 방식은…",
    option_a: "사실/상세/장면이 또렷하다 (S)",
    option_b: "느낌/맥락/메시지가 남는다 (N)"
  },

  // TF
  {
    dimension: "TF",
    sort_order: 9,
    text: "의견이 갈릴 때 나는…",
    option_a: "논리와 기준으로 결정한다 (T)",
    option_b: "사람의 마음과 분위기를 고려한다 (F)"
  },
  {
    dimension: "TF",
    sort_order: 10,
    text: "피드백을 줄 때 더 중요한 건…",
    option_a: "정확한 문제와 개선점 (T)",
    option_b: "상대의 기분과 동기 (F)"
  },
  {
    dimension: "TF",
    sort_order: 11,
    text: "갈등 상황에서 나는…",
    option_a: "원인과 해결을 빠르게 정리한다 (T)",
    option_b: "감정을 먼저 풀고 공감한다 (F)"
  },
  {
    dimension: "TF",
    sort_order: 12,
    text: "내가 더 편한 칭찬은…",
    option_a: "결과/성과에 대한 칭찬 (T)",
    option_b: "노력/마음에 대한 칭찬 (F)"
  },

  // JP
  {
    dimension: "JP",
    sort_order: 13,
    text: "여행 계획은…",
    option_a: "미리 루트와 시간을 정해둔다 (J)",
    option_b: "그때그때 끌리는 대로 간다 (P)"
  },
  {
    dimension: "JP",
    sort_order: 14,
    text: "마감이 있을 때 나는…",
    option_a: "미리미리 끝내고 마음 편해진다 (J)",
    option_b: "몰입이 올 때 한 번에 한다 (P)"
  },
  {
    dimension: "JP",
    sort_order: 15,
    text: "내 일정표는…",
    option_a: "정돈되어 있고 예측 가능하다 (J)",
    option_b: "유동적이고 즉흥이 섞인다 (P)"
  },
  {
    dimension: "JP",
    sort_order: 16,
    text: "새로운 아이디어가 생기면…",
    option_a: "실행 계획부터 세운다 (J)",
    option_b: "일단 열어두고 더 붙여본다 (P)"
  }
];

async function initDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = openDb();
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dimension TEXT NOT NULL CHECK (dimension IN ('EI','SN','TF','JP')),
      sort_order INTEGER NOT NULL UNIQUE,
      text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      measured_at TEXT NOT NULL,
      mbti TEXT NOT NULL,
      detail_json TEXT
    )`
  );

  const row = await get(db, "SELECT COUNT(*) AS cnt FROM questions");
  if (!row || row.cnt === 0) {
    for (const q of SEED_QUESTIONS) {
      await run(
        db,
        `INSERT INTO questions (dimension, sort_order, text, option_a, option_b, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [q.dimension, q.sort_order, q.text, q.option_a, q.option_b]
      );
    }
  }

  db.close();
}

module.exports = { initDb };

