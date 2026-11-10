import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createCouncilServer } from "./local-server.mjs";

async function setup(t,opts={}) {
  const dir=await mkdtemp(join(tmpdir(),"zunva-ui-test-"));
  const s=await createCouncilServer({port:0,storeDir:dir,...opts});
  t.after(async()=>{await s.close();await rm(dir,{recursive:true,force:true})});
  const req=async(path,method="GET",body,origin=s.url)=>{
    const resp=await fetch(s.url+path,{method,headers:{"Content-Type":"application/json",...(method==="POST"?{"Origin":origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:resp.status,data:await resp.json()};
  };
  return {url:s.url,dir,req};
}
test("dashboard serves HTML only via local HTTP",async(t)=>{
  const {url}=await setup(t);
  const r=await fetch(url);
  assert.equal(r.status,200);
  assert.match(await r.text(),/ZUNVA AI Council/);
  assert.equal(r.headers.get("x-frame-options"),"DENY");
});
test("demo session produces 2 opinions, 2 critiques and local decision",async(t)=>{
  const {req,dir}=await setup(t);
  const state=await req("/api/state");
  assert.equal(state.data.liveEnabled,false);
  const result=await req("/api/run","POST",{task:"Thử tính năng prompt ảnh",mode:"demo",rounds:2,confirmUsage:false});
  assert.equal(result.status,200);
  assert.equal(result.data.status,"awaiting-approval");
  const report=await req("/api/report?id="+result.data.id);
  assert.match(report.data.entry.report.initial.codex.text,/DEMO ONLY/);
  assert.match(report.data.entry.report.initial.gemini.text,/DEMO ONLY/);
  assert.ok(report.data.entry.report.review.codex.text);
  assert.ok(report.data.entry.report.review.gemini.text);
  const approved=await req("/api/decision","POST",{id:result.data.id,decision:"approved",note:"Duyệt phương án thử nghiệm, chưa được merge"});
  assert.equal(approved.status,200);
  const saved=JSON.parse(await readFile(join(dir,"run-"+result.data.id+".json"),"utf8"));
  assert.equal(saved.status,"approved");
  assert.match(saved.decisionNote,/chưa được merge/);
  assert.deepEqual((await readdir(dir)).length,1);
});
test("missing Gemini key blocks LIVE without calling any models",async(t)=>{
  let calls=0;
  const previous=process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  t.after(()=>{if(previous===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=previous;});
  const {req}=await setup(t,{enableLive:true,runner:async()=>{calls++;return {}}});
  const r=await req("/api/run","POST",{task:"analyze",mode:"live",rounds:1,confirmUsage:true});
  assert.equal(r.status,400);assert.match(r.data.error,/key absent/);assert.equal(calls,0);
});
test("LIVE mode is disabled by default even when confirmed",async(t)=>{
  const {req}=await setup(t);
  const r=await req("/api/run","POST",{task:"analyze",mode:"live",rounds:1,confirmUsage:true});
  assert.equal(r.status,403);
});
test("cross-origin POST and malformed task are refused",async(t)=>{
  const {req}=await setup(t);
  const cross=await req("/api/run","POST",{task:"X",mode:"demo",rounds:1},"http://evil.example");
  assert.equal(cross.status,403);
  const bad=await req("/api/run","POST",{task:"",mode:"demo",rounds:1});
  assert.equal(bad.status,400);
});
test("incomplete response does not permit founder approval",async(t)=>{
  const fake=async({task,mode,rounds})=>({task,mode,rounds,startedAt:new Date().toISOString(),initial:{
    codex:{ok:true,text:"some opinion"},gemini:{ok:false,error:"429 exhausted"}
  },review:{}});
  const {req}=await setup(t,{runner:fake});
  const r=await req("/api/run","POST",{task:"safe topic",mode:"demo",rounds:1});
  assert.equal(r.data.status,"incomplete");
  const d=await req("/api/decision","POST",{id:r.data.id,decision:"approved",note:""});
  assert.equal(d.status,409);
});

test("Claude is selectable in DEMO and selection is forwarded to the runner",async(t)=>{
  let seen;
  const fake=async(params)=>{
    seen=params;
    return {task:params.task,mode:"demo",rounds:1,startedAt:new Date().toISOString(),
      initial:{codex:{ok:true,text:"DEMO ONLY Codex"},claude:{ok:true,text:"DEMO ONLY Claude"}},review:{}};
  };
  const {req}=await setup(t,{runner:fake});
  const out=await req("/api/run","POST",{task:"Review the UX",mode:"demo",rounds:1,agents:["codex","claude"]});
  assert.equal(out.status,200);
  assert.deepEqual(seen.agents,["codex","claude"]);
  const details=await req("/api/report?id="+out.data.id);
  assert.ok(details.data.entry.report.initial.claude.text.includes("DEMO ONLY"));
});
test("Claude LIVE is forbidden unless explicitly enabled",async(t)=>{
  const {req}=await setup(t,{enableLive:true});
  const out=await req("/api/run","POST",{task:"Review the UX",mode:"live",rounds:1,agents:["codex","claude"],confirmUsage:true});
  assert.equal(out.status,403);
  assert.match(out.data.error,/Claude LIVE disabled/);
});
test("Kiro is not routed through this third-party Council harness",async(t)=>{
  const {req}=await setup(t);
  const out=await req("/api/run","POST",{task:"Review the UX",mode:"demo",rounds:1,agents:["codex","kiro"]});
  assert.equal(out.status,400);
  assert.match(out.data.error,/two distinct supported AI/);
});
test("two identical agents are rejected before any model call",async(t)=>{
  const {req}=await setup(t);
  const out=await req("/api/run","POST",{task:"Review the UX",mode:"demo",rounds:1,agents:["codex","codex"]});
  assert.equal(out.status,400);
});

test("Vietnamese dashboard JavaScript compiles and exposes Claude/Kiro handoff",async()=>{
  const html=await readFile(fileURLToPath(new URL("./dashboard.html",import.meta.url)),"utf8");
  const m=html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(m,"inline UI script must exist");
  assert.doesNotThrow(()=>new vm.Script(m[1],{filename:"dashboard.html"}));
  assert.match(html,/id="agent1"/);
  assert.match(html,/value="claude"/);
  assert.match(html,/id="kiroPacket"/);
  assert.match(html,/issues\/13/);
});

test("history keeps the 20 newest reports by timestamp and skips malformed files",async(t)=>{
  const dir=await mkdtemp(join(tmpdir(),"zunva-ui-history-"));
  for(let i=0;i<25;i++){
    const id=randomUUID();
    await writeFile(join(dir,"run-"+id+".json"),JSON.stringify({id,at:new Date(2026,0,1+i).toISOString(),mode:"demo",rounds:1,status:"awaiting-approval",task:"t"+i}));
  }
  await writeFile(join(dir,"run-"+randomUUID()+".json"),"{}");
  const s=await createCouncilServer({port:0,storeDir:dir});
  t.after(async()=>{await s.close();await rm(dir,{recursive:true,force:true})});
  const resp=await fetch(s.url+"/api/state");
  assert.equal(resp.status,200);
  const {reports}=await resp.json();
  assert.deepEqual(reports.map(r=>r.task),Array.from({length:20},(_,i)=>"t"+(24-i)));
});
