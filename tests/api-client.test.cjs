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
    process: { env: {} },
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    console,
  });
  return exports;
}
const { parseApiBaseUrl } = load("src/config/env.ts");
const { isStudentIdentity } = load("src/types/api.ts");
const { createApiClient } = load("src/lib/api/client.ts", {
  "../../config/env": { apiBaseUrl: null },
});
const baseUrl = "https://school.example/api/v1";
const make = (extra = {}) =>
  createApiClient({
    baseUrl,
    token: () => "token-A",
    onUnauthorized: () => {},
    ...extra,
  });
test("API configuration rejects credentials, arbitrary path and missing URL", () => {
  assert.equal(parseApiBaseUrl(), null);
  assert.equal(parseApiBaseUrl("https://u:p@school.example/api/v1"), null);
  assert.equal(parseApiBaseUrl("file:///api/v1"), null);
  assert.equal(parseApiBaseUrl("https://school.example"), null);
  assert.equal(parseApiBaseUrl(baseUrl + "/"), baseUrl);
});
test("only validated student identity is accepted", () => {
  const x = {
    accountId: 1,
    username: "hv1",
    role: "STUDENT",
    mustChangePassword: true,
  };
  assert.equal(isStudentIdentity(x), true);
  for (const change of [
    { role: "ADMIN" },
    { accountId: null },
    { mustChangePassword: undefined },
  ])
    assert.equal(isStudentIdentity({ ...x, ...change }), false);
});
test("authenticated request carries token and JSON body", async () => {
  let captured;
  const api = make({
    fetcher: async (url, init) => {
      captured = { url, init };
      return new Response('{"ok":true}', { status: 200 });
    },
  });
  assert.equal(
    (await api("/test", { method: "POST", body: { name: "A" } })).ok,
    true,
  );
  assert.equal(captured.url, baseUrl + "/test");
  assert.equal(captured.init.headers.Authorization, "Bearer token-A");
  assert.equal(captured.init.body, '{"name":"A"}');
  assert.equal(captured.init.redirect, "error");
});
test("public requests omit authorization", async () => {
  await make({
    fetcher: async (_, init) => {
      assert.equal(init.headers.Authorization, undefined);
      return new Response("{}");
    },
  })("/auth/login", { authenticated: false });
});
test("missing configuration/token never sends request", async () => {
  let sent = false;
  const fetcher = async () => {
    sent = true;
    return new Response("{}");
  };
  await assert.rejects(
    make({ baseUrl: null, fetcher })("/test"),
    (e) => e.kind === "configuration",
  );
  await assert.rejects(
    make({ token: () => null, fetcher })("/test"),
    (e) => e.status === 401,
  );
  assert.equal(sent, false);
});
test("external and traversal routes cannot leak bearer token", async () => {
  for (const p of [
    "https://evil.example",
    "//evil.example",
    "/../auth",
    "/%2e%2e/auth",
    "/bad\\path",
  ])
    await assert.rejects(make()(p), (e) => e.kind === "configuration");
});
test("401 invalidates exactly the token used by the request", async () => {
  let rejected;
  await assert.rejects(
    make({
      onUnauthorized: (t) => {
        rejected = t;
      },
      fetcher: async () => new Response("{}", { status: 401 }),
    })("/me"),
    (e) => e.status === 401,
  );
  assert.equal(rejected, "token-A");
});
test("403 does not clear a valid session or leak server message", async () => {
  let revoked = false;
  await assert.rejects(
    make({
      onUnauthorized: () => {
        revoked = true;
      },
      fetcher: async () =>
        new Response('{"message":"private stack","code":"DENIED"}', {
          status: 403,
        }),
    })("/test"),
    (e) =>
      e.status === 403 && e.code === "DENIED" && !e.message.includes("private"),
  );
  assert.equal(revoked, false);
});
test("204 handles empty body", async () => {
  assert.equal(
    await make({ fetcher: async () => new Response(null, { status: 204 }) })(
      "/test",
    ),
    undefined,
  );
});
test("malformed success JSON reports invalid response", async () => {
  await assert.rejects(
    make({ fetcher: async () => new Response("<html>") })("/test"),
    (e) => e.kind === "invalid-response",
  );
});
test("network failure has stable safe error", async () => {
  await assert.rejects(
    make({
      fetcher: async () => {
        throw Error("secret-host");
      },
    })("/test"),
    (e) => e.kind === "network" && !e.message.includes("secret"),
  );
});
test("timeout aborts transport; mutations are never automatically retried", async () => {
  let count = 0;
  await assert.rejects(
    make({
      timeoutMs: 5,
      fetcher: async (_, init) => {
        count++;
        return new Promise((_, reject) =>
          init.signal.addEventListener("abort", () => reject(Error("aborted"))),
        );
      },
    })("/pay", { method: "POST", body: { requestId: "same" } }),
    (e) => e.kind === "timeout",
  );
  assert.equal(count, 1);
});
test("caller cancellation is distinct from timeout", async () => {
  const c = new AbortController();
  const promise = make({
    fetcher: async (_, init) =>
      new Promise((_, reject) =>
        init.signal.addEventListener("abort", () => reject(Error("aborted"))),
      ),
  })("/test", { signal: c.signal });
  c.abort();
  await assert.rejects(promise, (e) => e.kind === "cancelled");
});
