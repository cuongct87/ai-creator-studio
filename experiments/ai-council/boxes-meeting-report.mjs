#!/usr/bin/env node
// ZUNVA AI Council: evidence-first report from independently completed cloud agents.
// Does not start agents, contact Boxes.dev, or modify source code.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const APPROVED = new Set(['codex', 'claude', 'gemini', 'kiro']);
const redact = input => String(input ?? '')
  .replace(/(?:sk-[\w-]{16,}|gh[pousr]_[\w]{20,}|AIza[\w-]{20,})/g, '[REDACTED]')
  .replace(/(\b(?:api[_ -]?key|token|password|secret)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]');
const clean = value => redact(value).slice(0, 16000);
const asStr = v => typeof v === 'string' ? v.trim() : '';

export function inspectMeeting(meeting) {
  if (!meeting || typeof meeting !== 'object' || Array.isArray(meeting)) throw new Error('Invalid meeting JSON');
  if (!asStr(meeting.brief) || meeting.brief.length > 6000) throw new Error('Brief must be 1–6000 characters');
  if (!Array.isArray(meeting.participants) || meeting.participants.length < 2 || meeting.participants.length > 4) {
    throw new Error('Expected 2–4 participant records');
  }
  const seen = new Set();
  const participantThreads = new Set();
  const problems = [];
  for (const p of meeting.participants) {
    const agent = asStr(p?.agent).toLowerCase();
    if (!APPROVED.has(agent) || seen.has(agent)) throw new Error('Participant must be a unique supported agent');
    seen.add(agent);
    if (p?.mode !== 'LIVE') problems.push(`${agent}: chưa chứng minh là AI LIVE`);
    if (p?.status !== 'completed') problems.push(`${agent}: chưa xác nhận lượt chạy hoàn thành`);
    if (!asStr(p?.threadId)) problems.push(`${agent}: thiếu thread ID`);
    else if (participantThreads.has(asStr(p.threadId))) problems.push(`${agent}: thread ID trùng với AI khác, chưa chứng minh chạy độc lập`);
    else participantThreads.add(asStr(p.threadId));
    if (!asStr(p?.response)) problems.push(`${agent}: thiếu câu trả lời thực tế`);
    if (agent === 'kiro' && p?.provider !== 'kiro-native') problems.push('Kiro chưa có bằng chứng chạy bằng cơ chế Kiro chính thức');
  }
  const debates = Array.isArray(meeting.crossReviews) ? meeting.crossReviews : [];
  const reviewed = new Set();
  if (debates.length < seen.size) problems.push('Chưa đủ lượt phản biện độc lập từ từng AI');
  for (const r of debates) {
    const reviewer = asStr(r?.agent).toLowerCase();
    const target = asStr(r?.targetAgent).toLowerCase();
    if (!seen.has(reviewer) || !asStr(r?.response) || !asStr(r?.threadId)) {
      problems.push('Có lượt phản biện thiếu agent, nội dung hoặc thread ID');
    }
    if (reviewed.has(reviewer)) problems.push(`${reviewer}: có nhiều lượt phản biện nhưng không thay thế được ý kiến AI khác`);
    else reviewed.add(reviewer);
    if (!seen.has(target) || target === reviewer) {
      problems.push(`${reviewer}: phải nêu targetAgent là AI khác trong cùng cuộc họp`);
    }
    if (r?.mode !== 'LIVE' || r?.status !== 'completed') {
      problems.push(`${reviewer}: chưa chứng minh lượt phản biện đã hoàn thành ở chế độ LIVE`);
    }
  }
  for (const agent of seen) {
    if (!reviewed.has(agent)) problems.push(`${agent}: thiếu lượt phản biện chéo`);
  }
  return { status: problems.length ? 'CHƯA ĐỦ BẰNG CHỨNG' : 'CHỜ FOUNDER NGHIỆM THU', problems };
}

export function renderFounderReport(meeting) {
  const {status, problems} = inspectMeeting(meeting);
  const parts = [
    '# ZUNVA AI Council — Biên bản họp cloud', '',
    `**Trạng thái: ${status}**`, '',
    '## Yêu cầu của founder', clean(meeting.brief), '',
    '## Ý kiến độc lập'
  ];
  for (const p of meeting.participants) {
    parts.push(`### ${asStr(p.agent).toUpperCase()}`, `- Chế độ: ${p.mode === 'LIVE' ? 'LIVE' : 'CHƯA XÁC NHẬN'}`,
      `- Kết quả: ${p.status === 'completed' ? 'completed' : 'chưa hoàn tất'}`,
      `- Thread: ${clean(p.threadId || 'chưa có')}`,
      `- Nguồn: ${clean(p.threadUrl || 'chưa cung cấp')}`,
      '', clean(p.response || 'CHƯA CÓ'), '');
  }
  parts.push('## Phản biện chéo');
  if (Array.isArray(meeting.crossReviews) && meeting.crossReviews.length) {
    for (const r of meeting.crossReviews) parts.push(`### ${clean(r.agent || '?')} phản biện ${clean(r.targetAgent || 'CHƯA RÕ ĐỐI TƯỢNG')}`, `- Thread: ${clean(r.threadId || 'chưa có')}`, `- Trạng thái: ${r.mode === 'LIVE' && r.status === 'completed' ? 'LIVE completed' : 'CHƯA XÁC NHẬN'}`, clean(r.response || 'CHƯA CÓ'), '');
  } else parts.push('CHƯA CÓ phản biện chéo.', '');
  parts.push('## Đồng thuận / bất đồng / rủi ro',
    `- Đồng thuận: ${clean(meeting.consensus || 'Chưa được tổng hợp')}`,
    `- Bất đồng: ${clean(meeting.disagreements || 'Chưa được tổng hợp')}`,
    `- Rủi ro: ${clean(meeting.risks || 'Chưa được tổng hợp')}`,
    `- Chi phí / quota thực tế: ${clean(meeting.usage || 'Chưa có số liệu')}`,
    `- PR / bằng chứng test: ${clean(meeting.prUrl || 'Chưa có PR')} ; ${clean(meeting.testEvidence || 'Chưa có log test')}`, '');
  if (problems.length) parts.push('## Thiếu bằng chứng', ...problems.map(x => '- ' + x), '');
  parts.push('## Quyết định của founder', '- [ ] Duyệt phương án', '- [ ] Yêu cầu sửa / phản biện thêm',
    '- [ ] Cho phép triển khai trên nhánh riêng (không tự merge/deploy)', '',
    '> Không được xem biên bản này là bằng chứng 4 AI đã kết nối nếu chưa có thread và kết quả LIVE của từng bên.', '');
  return parts.join('\n');
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('node boxes-meeting-report.mjs --input=/path/to/meeting.json --output=/path/to/report.md');
    return;
  }
  const get = key => argv.find(a => a.startsWith(key))?.slice(key.length);
  const input = get('--input=');
  const output = get('--output=');
  if (!input || !output) throw new Error('Required --input=... and --output=...');
  const meeting = JSON.parse(await readFile(resolve(input),'utf8'));
  await writeFile(resolve(output), renderFounderReport(meeting), 'utf8');
  console.log('Saved report. ' + inspectMeeting(meeting).status + '. No cloud actions performed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(e => { console.error('Council report error: ' + String(e.message).slice(0,200)); process.exitCode=1; });
}
