import test from "node:test";
import assert from "node:assert/strict";
import { argsFor, decode, formatReport, launchFor, restrictedChildEnv, runCouncil } from "./council.mjs";

test("demo produces two opinions and two critiques without credentials", async () => {
  const r = await runCouncil({task:"Giúp người dùng viết prompt ảnh",mode:"demo",rounds:2});
  assert.equal(r.mode,"demo");
  assert.equal(r.initial.codex.ok,true);
  assert.equal(r.initial.gemini.ok,true);
  assert.equal(r.review.codex.ok,true);
  assert.equal(r.review.gemini.ok,true);
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

test("Windows Codex uses its installed JS entry via Node (no shell)", () => {
  const launcher=launchFor("codex",{
    platform:"win32", env:{APPDATA:"C:/Users/example/AppData/Roaming"},
    nodeBinary:"C:/Program Files/nodejs/node.exe", exists:()=>true
  });
  assert.equal(launcher.command,"C:/Program Files/nodejs/node.exe");
  assert.equal(launcher.prefixArgs.length,1);
  assert.ok(launcher.prefixArgs[0].endsWith("codex.js"));
  assert.ok(launcher.prefixArgs[0].includes("@openai"));
});

test("Windows Codex rejects missing entry instead of executing npm shim", () => {
  assert.throws(
    ()=>launchFor("codex",{platform:"win32",env:{APPDATA:"C:/Users/example/AppData/Roaming"},exists:()=>false}),
    /entry not found/
  );
});

test("live refuses absent Gemini key before any provider invocation", async () => {
  const saved=process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(
      runCouncil({task:"Can you evaluate a brief?",mode:"live",confirmUsage:true,agents:["codex","gemini"]}),
      /GEMINI_API_KEY missing/
    );
  } finally {
    if (saved===undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY=saved;
  }
});

test("CLI child environment strips sensitive API keys and tokens", () => {
  const env=restrictedChildEnv({
    PATH:"C:/Windows/System32",APPDATA:"C:/Users/demo/AppData/Roaming",
    GEMINI_API_KEY:"DO_NOT_PASS",GOOGLE_API_KEY:"DO_NOT_PASS",
    OPENAI_API_KEY:"DO_NOT_PASS",GH_TOKEN:"DO_NOT_PASS",
    MY_SECRET:"DO_NOT_PASS",USERPROFILE:"C:/Users/demo"
  });
  assert.equal(env.PATH,"C:/Windows/System32");
  assert.equal(env.USERPROFILE,"C:/Users/demo");
  assert.equal(env.GEMINI_API_KEY,undefined);
  assert.equal(env.GOOGLE_API_KEY,undefined);
  assert.equal(env.OPENAI_API_KEY,undefined);
  assert.equal(env.GH_TOKEN,undefined);
  assert.equal(env.MY_SECRET,undefined);
});

test("Claude preflight blocks LIVE before calling any AI when login missing", async () => {
  await assert.rejects(runCouncil({
    task:"Assess a non-sensitive product idea",mode:"live",
    agents:["codex","claude"],confirmUsage:true,
    claudeAuthCheck:async()=>false
  }),/not authenticated.*no AI called/);
});
test("Claude option works as clearly marked DEMO without credentials", async()=>{
  const r=await runCouncil({task:"Review concept",agents:["gemini","claude"],mode:"demo",rounds:2});
  assert.equal(r.initial.claude.ok,true);
  assert.match(r.initial.claude.text,/DEMO ONLY/);
  assert.equal(r.review.claude.ok,true);
});


test("report distinguishes complete demo from a partial or failed session", async () => {
  const complete=await runCouncil({task:"Review brief",mode:"demo",rounds:2});
  assert.equal(complete.complete,true);
  assert.match(formatReport(complete),/HOÀN TẤT CÁC VÒNG/);
  const partial={...complete,complete:false,review:{codex:{ok:false,error:"Provider unavailable"}}};
  assert.match(formatReport(partial),/CHƯA HOÀN TẤT \/ CÓ LỖI/);
  assert.doesNotMatch(formatReport(partial),/Kết quả phiên: \*\*HOÀN TẤT CÁC VÒNG/);
  assert.match(formatReport(partial),/Provider unavailable/);
});
