const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
function load(file, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (n) => {
      if (n in imports) return imports[n];
      throw Error("Unexpected import " + n);
    },
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  return exports;
}
const client = load("src/lib/api/client.ts");
const types = load("src/types/api.ts");
const { createSessionManager } = load("src/lib/session/manager.ts", {
  "../api/client": client,
  "../../types/api": types,
});
const me = {
  accountId: 11,
  username: "student-a",
  role: "STUDENT",
  mustChangePassword: false,
};
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status });
function storage(initial = null) {
  let value = initial;
  return {
    read: async () => value,
    write: async (v) => {
      value = v;
    },
    clear: async () => {
      value = null;
    },
    value: () => value,
  };
}
function make(fetcher, store = storage()) {
  return {
    store,
    manager: createSessionManager({
      baseUrl: "https://school.example/api/v1",
      storage: store,
      fetcher,
    }),
  };
}
test("new installation stays anonymous and exposes no preview entry point", async () => {
  const { manager } = make(async () => {
    throw Error("Must not fetch");
  });
  await manager.restore();
  assert.equal(manager.startPreview, undefined);
  assert.equal(manager.getSnapshot().status, "anonymous");
  assert.equal(manager.getSnapshot().preview, undefined);
});
test("login verifies me before persisting and preserves activation flag", async () => {
  const { manager, store } = make(async (url) =>
    url.endsWith("/login")
      ? json({ role: "STUDENT", token: "new-token" })
      : json({ ...me, mustChangePassword: true }),
  );
  await manager.restore();
  await manager.login("student-a", "temporary-pass");
  assert.equal(manager.getSnapshot().status, "authenticated");
  assert.equal(manager.getSnapshot().identity.mustChangePassword, true);
  assert.equal(store.value(), "new-token");
});
test("staff/admin/teacher accounts cannot be saved as student sessions", async () => {
  for (const role of ["SUPER_ADMIN", "ADMIN", "STAFF", "TEACHER"]) {
    const { manager, store } = make(async () =>
      json({ role, token: "wrong-role" }),
    );
    await manager.restore();
    await assert.rejects(manager.login("x", "secret"), (e) => e.status === 403);
    assert.equal(store.value(), null);
    assert.equal(manager.getSnapshot().status, "anonymous");
  }
});
test("untrusted login response alone cannot grant access", async () => {
  const { manager, store } = make(async (url) =>
    url.endsWith("/login")
      ? json({ role: "STUDENT", token: "bad-profile" })
      : json({ ...me, role: "ADMIN" }),
  );
  await manager.restore();
  await assert.rejects(manager.login("x", "secret"));
  assert.equal(store.value(), null);
});
test("restore validates live identity and rejects wrong role", async () => {
  const { manager, store } = make(
    async () => json({ ...me, role: "STAFF" }),
    storage("old"),
  );
  await manager.restore();
  assert.equal(manager.getSnapshot().status, "anonymous");
  assert.equal(store.value(), null);
});
test("401 clears expired token; network interruption preserves token for retry", async () => {
  let online = false;
  const { manager, store } = make(
    async () => (online ? json(me) : json({}, 503)),
    storage("existing"),
  );
  await manager.restore();
  assert.equal(manager.getSnapshot().status, "error");
  assert.equal(store.value(), "existing");
  online = true;
  await manager.restore();
  assert.equal(manager.getSnapshot().status, "authenticated");
  const expired = make(async () => json({}, 401), storage("expired"));
  await expired.manager.restore();
  assert.equal(expired.manager.getSnapshot().status, "anonymous");
  assert.equal(expired.store.value(), null);
});
test("logout while offline clears local data and reports server not confirmed", async () => {
  const { manager, store } = make(
    async (url) =>
      url.endsWith("/logout-all") ? Promise.reject(Error("offline")) : json(me),
    storage("valid"),
  );
  await manager.restore();
  assert.equal(await manager.logoutAll(), false);
  assert.equal(store.value(), null);
  assert.equal(manager.getSnapshot().identity, null);
});
test("late me response cannot restore a session after logout", async () => {
  let resolve;
  const { manager, store } = make(
    async () =>
      new Promise((r) => {
        resolve = r;
      }),
    storage("old"),
  );
  const task = manager.restore();
  await new Promise((r) => setTimeout(r, 0));
  await manager.clearLocalSession();
  resolve(json(me));
  await task;
  assert.equal(store.value(), null);
  assert.equal(manager.getSnapshot().status, "anonymous");
});
test("late login response after local logout cannot persist a token", async () => {
  let resolve;
  const { manager, store } = make(async (url) =>
    url.endsWith("/login")
      ? new Promise((r) => {
          resolve = r;
        })
      : json(me),
  );
  await manager.restore();
  const task = manager.login("student-a", "secret");
  await new Promise((r) => setTimeout(r, 0));
  await manager.clearLocalSession();
  resolve(json({ role: "STUDENT", token: "late" }));
  await task;
  assert.equal(store.value(), null);
  assert.equal(manager.getSnapshot().status, "anonymous");
});
