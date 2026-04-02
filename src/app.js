const path = require("path");
const express = require("express");
const session = require("express-session");
const { initDb } = require("./dbInit");

const indexRouter = require("./routes/index");
const testRouter = require("./routes/test");
const typesRouter = require("./routes/types");
const adminRouter = require("./routes/admin");
const resultsRouter = require("./routes/results");

function resolvePort(defaultPort = 3000) {
  const p = process.env.PORT ? Number(process.env.PORT) : defaultPort;
  return Number.isFinite(p) && p > 0 ? p : defaultPort;
}

function listenWithFallback(app, startPort, tries = 10) {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let remaining = tries;

    const tryListen = () => {
      const server = app.listen(port, () => {
        resolve({ server, port });
      });

      server.on("error", (err) => {
        if (err && err.code === "EADDRINUSE" && remaining > 0) {
          remaining -= 1;
          port += 1;
          tryListen();
          return;
        }
        reject(err);
      });
    };

    tryListen();
  });
}

async function main() {
  await initDb();

  const app = express();

  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "ejs");

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mbti-dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 6
      }
    })
  );

  app.use((req, res, next) => {
    res.locals.nav = [
      { href: "/test", label: "MBTI테스트" },
      { href: "/types", label: "성격 유형" },
      { href: "/admin/questions", label: "질문 수정" },
      { href: "/results", label: "결과 보기" }
    ];
    res.locals.currentPath = req.path;
    next();
  });

  app.use("/public", express.static(path.join(__dirname, "..", "public")));

  app.use("/", indexRouter);
  app.use("/test", testRouter);
  app.use("/types", typesRouter);
  app.use("/admin", adminRouter);
  app.use("/results", resultsRouter);

  app.use((req, res) => {
    res.status(404).render("pages/404", { title: "페이지를 찾을 수 없어요" });
  });

  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).render("pages/500", { title: "오류가 발생했어요", err });
  });

  const startPort = resolvePort(3000);
  const { port } = await listenWithFallback(app, startPort, 20);
  // eslint-disable-next-line no-console
  console.log(`MBTI app listening on http://localhost:${port}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

