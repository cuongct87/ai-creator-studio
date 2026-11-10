import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("Kiro V3 lead config loads with a scoped delegation contract",async()=>{
  const agent=await readFile(new URL("../../.kiro/agents/zunva-council-lead.md",import.meta.url),"utf8");
  const contract=await readFile(new URL("./KIRO-LEAD-CONTRACT.md",import.meta.url),"utf8");
  assert.match(agent,/^---\nname: zunva-council-lead\n/);
  assert.match(agent,/file:\/\/\.\/experiments\/ai-council\/KIRO-LEAD-CONTRACT\.md/);
  assert.match(agent,/sub-agents|subagents/);
  assert.match(contract,/Builder/);
  assert.match(contract,/Reviewer/);
  assert.match(contract,/Tester/);
  assert.match(contract,/chưa merge\/deploy/);
  assert.doesNotMatch(agent,/trust-all-tools|effect:\s*allow|model:\s*claude-opus-5\.5/i);
});
