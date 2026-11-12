const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (n) => {
      if (n in imports) return imports[n];
      throw Error(n);
    },
    URL,
    URLSearchParams,
    Intl,
    Date,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  return exports;
}
const api = load("src/lib/api/client.ts");
const u = load("src/features/learning/utils.ts", {
  "../../lib/api/client": api,
});
test("business day uses Vietnam even before device midnight", () => {
  assert.equal(
    u.todayInVietnam(new Date("2026-11-08T20:00:00Z")),
    "2026-11-09",
  );
  assert.equal(
    u.todayInVietnam(new Date("2026-11-08T16:59:59Z")),
    "2026-11-08",
  );
});
test("calendar arithmetic handles Sunday, leap day and year boundary", () => {
  assert.equal(u.weekStart("2026-11-15"), "2026-11-09");
  assert.equal(u.addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(u.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(u.isDate("2026-02-30"), false);
  assert.equal(u.isDate("2024-02-29"), true);
});
test("schedule query is sanitized and date windows are day or Monday-Sunday", () => {
  const p = u.scheduleParams({
    date: "2026-11-15",
    view: "week",
    enrollmentId: "14",
  });
  assert.equal(p.date, "2026-11-15");
  assert.equal(p.enrollmentId, "14");
  assert.equal(u.dateWindow(p.date, p.view).from, "2026-11-09");
  assert.equal(u.dateWindow(p.date, p.view).to, "2026-11-15");
  assert.equal(u.dateWindow(p.date, "day").to, p.date);
  assert.equal(
    u.scheduleParams({ view: "bogus", enrollmentId: "../1" }).view,
    "day",
  );
  assert.equal(u.validId("9007199254740992"), null);
});
test("protected return targets never redirect outside app", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "/welcome",
    "/sessions/../accounts",
    "/sessions/1#evil",
  ])
    assert.equal(u.safeReturnTo(value), null);
  assert.equal(u.safeReturnTo("/sessions/12"), "/sessions/12");
  assert.equal(u.safeReturnTo("/enrollments/4"), "/enrollments/4");
  const target = u.safeReturnTo(
    "/schedule?date=2026-11-15&view=week&enrollmentId=3&token=secret",
  );
  assert.ok(target.includes("enrollmentId=3"));
  assert.equal(target.includes("secret"), false);
});
test("all pages are read including final partial page", async () => {
  let calls = 0;
  const result = await u.loadAllPages(async (path) => {
    const page = Number(
      new URL("https://example.test" + path).searchParams.get("page"),
    );
    calls++;
    return {
      content: Array.from({ length: page === 2 ? 5 : 100 }, (_, i) => ({
        sessionId: page * 100 + i,
      })),
      page,
      size: 100,
      totalElements: 205,
      totalPages: 3,
    };
  }, "/schedule?from=2026-11-09");
  assert.equal(calls, 3);
  assert.equal(result.length, 205);
  assert.equal(result[204].sessionId, 204);
});
test("empty schedule reads page0 once without fabricated rows", async () => {
  let calls = 0;
  const rows = await u.loadAllPages(async () => {
    calls++;
    return { content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 };
  }, "/schedule");
  assert.equal(rows.length, 0);
  assert.equal(calls, 1);
});
test("changing totals are rejected instead of displaying partial schedule", async () => {
  let page = 0;
  await assert.rejects(
    u.loadAllPages(async () => {
      const current = page++;
      return {
        content: Array.from({ length: 100 }, (_, i) => ({
          id: current * 100 + i,
        })),
        page: current,
        size: 100,
        totalElements: current ? 201 : 200,
        totalPages: current ? 3 : 2,
      };
    }, "/schedule"),
    (e) => e.status === 409,
  );
});
test("duplicate session across pages is rejected", async () => {
  let page = 0;
  await assert.rejects(
    u.loadAllPages(
      async () => ({
        content: Array.from({ length: 100 }, (_, i) => ({ sessionId: i })),
        page: page++,
        size: 100,
        totalElements: 200,
        totalPages: 2,
      }),
      "/schedule",
    ),
    (e) => e.status === 409,
  );
});
test("malformed metadata cannot cause an infinite pagination loop", async () => {
  await assert.rejects(
    u.loadAllPages(
      async () => ({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      }),
      "/schedule",
    ),
    (e) => e.kind === "invalid-response",
  );
});
test("abort signal is forwarded to every page", async () => {
  const signal = new AbortController().signal;
  await u.loadAllPages(
    async (_, options) => {
      assert.equal(options.signal, signal);
      return {
        content: [],
        page: 0,
        size: 100,
        totalElements: 0,
        totalPages: 0,
      };
    },
    "/schedule",
    signal,
  );
});
test("overlap layout uses parallel lanes and frees a lane at exact end", () => {
  const rows = u.layoutDay([
    { sessionId: 1, startTime: "09:00", endTime: "10:00" },
    { sessionId: 2, startTime: "09:30", endTime: "10:30" },
    { sessionId: 3, startTime: "10:00", endTime: "11:00" },
    { sessionId: 4, startTime: "11:00", endTime: "12:00" },
  ]);
  assert.equal(rows[0].lanes, 2);
  assert.equal(rows[1].lane, 1);
  assert.equal(rows[2].lane, 0);
  assert.equal(rows[3].lanes, 1);
});
test("unknown, reversed and malformed time never gets a fake grid position", () => {
  assert.equal(u.minuteOfDay("24:00"), null);
  assert.equal(u.minuteOfDay("09:99"), null);
  assert.equal(
    u.layoutDay([
      { sessionId: 1, startTime: null, endTime: null },
      { sessionId: 2, startTime: "12:00", endTime: "11:00" },
    ]).length,
    0,
  );
});
