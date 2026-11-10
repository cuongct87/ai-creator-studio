import test from "node:test";
import assert from "node:assert/strict";
import { argsFor, decode, formatReport, runCouncil } from "./council.mjs";

test("demo produces two opinions and two critiques without credentials", async () => {
  const r = await runCouncil({task:"Giúp người dùng viết prompt ảnh",mode:"demo",rounds:2});
  assert.equal(r.mode,"demo");
  assert.equal(r.initial.codex.ok,true);
  assert.equal(r.initial.claude.ok,true);
  assert.equal(r.review.codex.ok,true);
  assert.equal(r.review.claude.ok,true);
  assert.match(formatReport(r),/CHỜ FOUNDER DUYỆT/);
  assert.match(formatReport(r),/MÔ PHỎNG/);
  assert.match(formatReport(r),/DEMO ONLY/);
});
test("live requires explicit quota consent", async () => {
  await assert.rejects(runCouncil({task:"kiểm tra",mode:"live"}),/confirm-usage/);
});
test("reject invalid task and agent list", async () => {
  await assert.rejects(runCouncil({task:" "}),/Task/);
  await assert.rejects(runCouncil({task:"hi",agents:["codex","codex"]}),/two distinct/);
  await assert.rejects(runCouncil({task:"hi",rounds:3}),/rounds/);
});
test("codex arguments use read-only and no bypass flags", () => {
  const args=argsFor("codex","/tmp/zunva");
  assert.ok(args.includes("read-only"));
  assert.ok(args.includes("--ignore-user-config"));
  assert.ok(args.includes("--ephemeral"));
  assert.ok(!args.includes("danger-full-access"));
});
test("decode refuses extra tool activity", () => {
  const bad='{"type":"item.started","item":{"type":"command_execution"}}\n{"type":"turn.completed"}';
  assert.throws(()=>decode("codex",bad),/tool activity/);
});
test("decode accepts completed text output", () => {
  const sample='{"type":"item.completed","item":{"type":"agent_message","text":"Nên kiểm thử"}}\n{"type":"turn.completed"}';
  assert.equal(decode("codex",sample),"Nên kiểm thử");
});
