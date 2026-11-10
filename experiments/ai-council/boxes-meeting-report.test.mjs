import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectMeeting, renderFounderReport } from './boxes-meeting-report.mjs';
const good = () => ({
  brief:'Kiểm thử chức năng xuất PNG cho ZUNVA',
  participants:[
    {agent:'codex',mode:'LIVE',status:'completed',threadId:'thr_codex1',response:'Cần kiểm tra hệ số DPI.',threadUrl:'https://boxes.dev/thread/1'},
    {agent:'claude',mode:'LIVE',status:'completed',threadId:'thr_claude1',response:'Cần kiểm tra chất lượng PNG.',threadUrl:'https://boxes.dev/thread/2'}
  ],
  crossReviews:[
    {agent:'codex',threadId:'thr_codex1',response:'Đồng ý bổ sung test ảnh.'},
    {agent:'claude',threadId:'thr_claude1',response:'Cần xem kích thước thực tế.'}
  ],consensus:'Thêm test',disagreements:'Mức DPI tối ưu chưa thống nhất',usage:'2 lượt agent, chi phí chưa đo'
});
test('two verified live peers yields founder review, never automatic approval',()=>{
  const x=good();assert.equal(inspectMeeting(x).status,'CHỜ FOUNDER NGHIỆM THU');
  const txt=renderFounderReport(x);
  assert.match(txt,/CHỜ FOUNDER NGHIỆM THU/);
  assert.match(txt,/- \[ \] Duyệt phương án/);
  assert.match(txt,/Bất đồng/);
});
test('demo, missing thread and unfinished run cannot claim live',()=>{
  const x=good();x.participants[1].mode='DEMO';x.participants[1].threadId='';x.participants[1].status='starting';
  assert.equal(inspectMeeting(x).status,'CHƯA ĐỦ BẰNG CHỨNG');
  assert.match(renderFounderReport(x),/thiếu thread ID/);
});
test('missing debate is not ready',()=>{
  const x=good();x.crossReviews=[];
  assert.equal(inspectMeeting(x).status,'CHƯA ĐỦ BẰNG CHỨNG');
});
test('Kiro cannot be treated as a native Boxes agent without verified native source',()=>{
  const x=good();x.participants[1]={agent:'kiro',mode:'LIVE',status:'completed',threadId:'thr_kiro1',response:'Xong'};
  assert.equal(inspectMeeting(x).status,'CHƯA ĐỦ BẰNG CHỨNG');
});
test('redact likely API keys from report text',()=>{
  const x=good();x.participants[0].response='token=ghp_abcdefghijklmnopqrstuvwxyz0123456789';
  const txt=renderFounderReport(x);
  assert.doesNotMatch(txt,/ghp_abcdefghijklmnopqrstuvwxyz/);
  assert.match(txt,/REDACTED/);
});
test('reject duplicate agent and oversized brief',()=>{
  const x=good();x.participants[1].agent='codex';
  assert.throws(()=>inspectMeeting(x),/unique supported/);
  x.participants[1].agent='claude';x.brief='A'.repeat(6001);
  assert.throws(()=>inspectMeeting(x),/6000/);
});
