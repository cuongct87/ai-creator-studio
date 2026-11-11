"""Minimal local SQLite queue with independent and cross-review AI adapters."""
import json, os, sqlite3, time, urllib.request, uuid
from pathlib import Path
DB = Path(os.environ.get("COUNCIL_DB", "council.sqlite3"))
def connect():
    db=sqlite3.connect(DB)
    db.execute('CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, prompt TEXT NOT NULL, state TEXT NOT NULL, evidence TEXT NOT NULL DEFAULT "[]", created REAL NOT NULL)')
    db.commit()
    return db
def submit(prompt):
    if not isinstance(prompt,str) or not prompt.strip() or len(prompt)>10000: raise ValueError("invalid prompt")
    ident=str(uuid.uuid4())
    with connect() as db: db.execute("INSERT INTO tasks (id,prompt,state,created) VALUES (?,?,?,?)",(ident,prompt,"queued",time.time()))
    return ident
def call_agent(role,prompt):
    url=os.environ.get(f"COUNCIL_{role}_URL")
    token=os.environ.get(f"COUNCIL_{role}_TOKEN")
    if not url or not token or not url.startswith("https://"): raise RuntimeError(f"{role}: HTTPS endpoint and token required")
    req=urllib.request.Request(url,json.dumps({"prompt":prompt,"role":role}).encode(),{"Content-Type":"application/json","Authorization":"Bearer "+token},method="POST")
    with urllib.request.urlopen(req,timeout=20) as response:
        if response.status!=200: raise RuntimeError(f"{role}: HTTP {response.status}")
        data=json.load(response)
    answer=data.get("answer")
    if not isinstance(answer,str) or not answer.strip() or len(answer)>20000: raise RuntimeError(f"{role}: invalid answer")
    return answer
def run_one(adapter=call_agent):
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        task=db.execute("SELECT id,prompt FROM tasks WHERE state='queued' ORDER BY created LIMIT 1").fetchone()
        if not task: return None
        db.execute("UPDATE tasks SET state='running' WHERE id=?",(task[0],))
        db.commit()
    ident,prompt=task
    evidence=[]
    try:
        for role in ("A","B"):
            answer=adapter(role,prompt)
            evidence.append({"role":role,"stage":"independent","answer":answer,"at":time.time()})
        for role,other in (("A","B"),("B","A")):
            original=next(e["answer"] for e in evidence if e["role"]==other)
            answer=adapter(role,"Review this independent answer critically, cite uncertainties and corrections. Task: "+prompt+"\nOther answer: "+original)
            evidence.append({"role":role,"stage":"cross_review","answer":answer,"at":time.time()})
        state="completed"
    except Exception as exc:
        state="failed"
        evidence.append({"stage":"error","error":type(exc).__name__,"at":time.time()})
    with connect() as db:
        db.execute("UPDATE tasks SET state=?,evidence=? WHERE id=?",(state,json.dumps(evidence,ensure_ascii=False),ident))
    return ident,state
def report(ident):
    with connect() as db: row=db.execute("SELECT state,evidence FROM tasks WHERE id=?",(ident,)).fetchone()
    if row is None: raise KeyError(ident)
    return {"id":ident,"state":row[0],"evidence":json.loads(row[1])}
if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest="cmd",required=True)
    sub.add_parser("run-one");a=sub.add_parser("submit");a.add_argument("prompt");b=sub.add_parser("report");b.add_argument("id")
    args=p.parse_args()
    result=submit(args.prompt) if args.cmd=="submit" else run_one() if args.cmd=="run-one" else report(args.id)
    print(json.dumps(result,ensure_ascii=False))
