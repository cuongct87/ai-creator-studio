#!/usr/bin/env node
// ZUNVA AI Council — private localhost dashboard, no external server, no third-party packages.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runCouncil, formatReport } from "./council.mjs";

const UI_FILE = fileURLToPath(new URL("./dashboard.html", import.meta.url));
const DEFAULT_STORE = join(homedir(), ".zunva-council", "reports");
const json = (res, code, obj) => {
  res.writeHead(code, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff", "Referrer-Policy":"no-referrer"});
  res.end(JSON.stringify(obj));
};
const safeError = (e) => {
  const s = String(e?.message ?? e).slice(0,350);
  return /api[_ -]?key|sk-[a-z0-9]/i.test(s) ? "Request failed; check local credentials and quotas." : s;
};
async function parseBody(req) {
  if (!req.headers["content-type"]?.startsWith("application/json")) throw new Error("JSON content type required");
  let raw = "";
  for await (const data of req) {
    raw += data.toString("utf8");
    if (raw.length > 16000) throw new Error("Request exceeds size limit");
  }
  return JSON.parse(raw);
}
function safeId(s) { return typeof s==="string" && /^[a-f0-9-]{36}$/.test(s) ? s : null; }

export async function createCouncilServer({
  port=8765, storeDir=DEFAULT_STORE, enableLive=false, runner=runCouncil, host="127.0.0.1"
}={}) {
  // Never expose the council to LAN or public networks.
  if (host !== "127.0.0.1") throw new Error("ZUNVA pilot must bind to 127.0.0.1 only");
  await mkdir(storeDir, {recursive:true,mode:0o700});
  let running = false;
  const recent = [];
  // Reports are local-only, with no API secrets in the saved files.
  const names = (await readdir(storeDir)).filter(x=>/^run-[a-f0-9-]{36}\.json$/.test(x)).sort().reverse().slice(0,20);
  for (const name of names) {
    try { const data = JSON.parse(await readFile(join(storeDir,name),"utf8")); recent.push(data); } catch { /* ignore broken local report */ }
  }
  const save = async (entry) => {
    await writeFile(join(storeDir,"run-"+entry.id+".json"),JSON.stringify(entry,null,2),{encoding:"utf8",mode:0o600});
  };
  const server = http.createServer(async(req,res)=>{
    const address = server.address();
    const expectedHost = "127.0.0.1:" + address.port;
    const expectedOrigin = "http://" + expectedHost;
    if (req.headers.host !== expectedHost) return json(res,403,{error:"Invalid host"});
    res.setHeader("X-Frame-Options","DENY");
    res.setHeader("Content-Security-Policy","default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    try {
      const url = new URL(req.url, expectedOrigin);
      if (req.method==="GET" && url.pathname==="/") {
        const html=await readFile(UI_FILE);
        res.writeHead(200, {"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
        return res.end(html);
      }
      if (req.method==="GET" && url.pathname==="/api/state") return json(res,200,{
        busy:running,liveEnabled:enableLive,
        geminiKeyLoaded:Boolean(process.env.GEMINI_API_KEY?.trim()),
        reports: recent.slice(0,20).map(x=>({id:x.id,at:x.at,mode:x.mode,rounds:x.rounds,status:x.status,task:x.task.slice(0,90)}))
      });
      if (req.method==="GET" && url.pathname==="/api/report") {
        const id=safeId(url.searchParams.get("id"));
        const entry=recent.find(x=>x.id===id);
        return entry ? json(res,200,{entry}) : json(res,404,{error:"Report not found"});
      }
      if (req.method!=="GET" && req.headers.origin !== expectedOrigin) return json(res,403,{error:"Blocked cross-origin request"});
      if (req.method==="POST" && url.pathname==="/api/run") {
        if(running) return json(res,409,{error:"A Council session is already running"});
        const b=await parseBody(req);
        const task=typeof b.task==="string"?b.task.trim():"";
        const rounds=b.rounds;
        const mode=b.mode;
        if(!task || task.length>6000 || ![1,2].includes(rounds) || !["demo","live"].includes(mode)) return json(res,400,{error:"Invalid task, mode or rounds"});
        if (mode==="live" && (!enableLive || b.confirmUsage!==true)) return json(res,403,{error:"Enable live mode at startup and confirm quota usage"});
        // Check the key BEFORE launching Codex to avoid spending quota on incomplete sessions.
        if (mode==="live" && !process.env.GEMINI_API_KEY?.trim()) return json(res,400,{error:"Gemini key absent in the server process; no model was called"});
        running=true;
        try {
          const report=await runner({task,mode,rounds,agents:["codex","gemini"],confirmUsage:mode==="live"});
          const status=Object.values(report.initial).every(x=>x.ok) &&
            (rounds===1 || Object.values(report.review).length===2 && Object.values(report.review).every(x=>x.ok))
            ? "awaiting-approval" : "incomplete";
          const entry={id:randomUUID(),at:new Date().toISOString(),mode,rounds,task,status,decisionNote:"",report,markdown:formatReport(report)};
          await save(entry);
          recent.unshift(entry); recent.splice(20);
          return json(res,200,{id:entry.id,status});
        } finally {running=false;}
      }
      if(req.method==="POST" && url.pathname==="/api/decision") {
        const b=await parseBody(req);
        const id=safeId(b.id);
        const entry=recent.find(x=>x.id===id);
        if(!entry) return json(res,404,{error:"Report not found"});
        if(entry.status==="incomplete") return json(res,409,{error:"Incomplete run cannot be approved"});
        if(!["approved","changes-requested"].includes(b.decision)) return json(res,400,{error:"Invalid decision"});
        if(typeof b.note!=="string" || b.note.length>1000) return json(res,400,{error:"Decision note too long"});
        entry.status=b.decision;
        entry.decisionNote=b.note;
        entry.decisionAt=new Date().toISOString();
        await save(entry);
        // This ONLY records a decision. It never executes code or merges PRs.
        return json(res,200,{ok:true,status:entry.status});
      }
      return json(res,404,{error:"Not found"});
    } catch(e) {return json(res,400,{error:safeError(e)});}
  });
  await new Promise((resolve,reject)=>{
    server.once("error",reject);
    server.listen(port,host,resolve);
  });
  const actualPort=server.address().port;
  return {url:"http://127.0.0.1:"+actualPort, close:()=>new Promise(resolve=>server.close(resolve))};
}
if (process.argv[1] && fileURLToPath(import.meta.url)===fileURLToPath(new URL("file://"+process.argv[1].replace(/\\/g,"/")))) {
  // This branch is unlikely on Windows for drive letters; robust startup below.
  void 0;
}
const direct = process.argv[1] && import.meta.url === new URL("./"+process.argv[1].replace(/\\/g,"/"),"file:///").href;
if (process.argv[1] && /local-server\.mjs$/i.test(process.argv[1]) && !process.env.ZUNVA_SKIP_START) {
  createCouncilServer({enableLive:process.argv.includes("--enable-live")}).then(({url})=>{
    console.log("ZUNVA AI Council local dashboard: "+url);
    console.log("Only this computer can connect. Ctrl+C to stop. Live quota: "+(process.argv.includes("--enable-live")?"enabled":"disabled"));
  }).catch(e=>{console.error("Unable to start Council:",safeError(e));process.exitCode=1;});
}
