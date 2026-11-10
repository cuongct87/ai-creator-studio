import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
