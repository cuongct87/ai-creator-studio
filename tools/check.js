// ZUNVA quick static checks — free, no AI credits. Run: node tools/check.js [webDir]
// webDir defaults to current folder (where index.html lives).
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.resolve(process.argv[2] || '.');
const FILES = ['index.html','script.js','studio_v15.js','style.css','vault_i18n.js'];
let fails = 0, warns = 0;
const ok = m => console.log('  OK   ' + m);
const bad = m => { fails++; console.log('  FAIL ' + m); };
const warn = m => { warns++; console.log('  WARN ' + m); };
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

console.log('Folder: ' + dir);
console.log('1) Files exist');
for (const f of FILES) fs.existsSync(path.join(dir, f)) ? ok(f) : bad('missing ' + f);

console.log('2) JavaScript syntax');
for (const f of FILES.filter(x => x.endsWith('.js') && fs.existsSync(path.join(dir, x)))) {
  try { new vm.Script(read(f), { filename: f }); ok(f); } catch (e) { bad(f + ': ' + e.message); }
}

console.log('3) Possible secrets (API keys)');
const patterns = [/AIza[0-9A-Za-z_\-]{30,}/, /sk-[A-Za-z0-9]{20,}/, /ghp_[A-Za-z0-9]{30,}/];
let found = false;
for (const f of FILES.filter(x => fs.existsSync(path.join(dir, x)))) {
  const t = read(f);
  patterns.forEach(p => { if (p.test(t)) { bad(f + ' matches secret pattern ' + p); found = true; } });
}
if (!found) ok('no key patterns found');

console.log('4) HTML ids referenced in JS exist in index.html (getElementById / $)');
if (fs.existsSync(path.join(dir,'index.html'))) {
  const html = read('index.html');
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
  const dyn = read('studio_v15.js') + read('script.js');
  // ids created dynamically in JS are allowed
  const created = new Set([...dyn.matchAll(/id=\\?["']([A-Za-z0-9_\-]+)\\?["']/g)].map(m => m[1]));
  const used = new Set([...dyn.matchAll(/(?:getElementById|\$)\(\s*['"]([A-Za-z0-9_\-]+)['"]\s*\)/g)].map(m => m[1]));
  const missing = [...used].filter(i => !ids.has(i) && !created.has(i));
  missing.length ? warn('ids not found in HTML or JS templates: ' + missing.join(', ')) : ok('all referenced ids found');
}

console.log('5) Scripts/styles linked in index.html are in the Android whitelist');
const java = (function find(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) {
  if (e.name==='node_modules'||e.name==='.git') continue;
  const p = path.join(d,e.name);
  if (e.isDirectory()) { const r = find(p); if (r) return r; }
  else if (e.name==='MainActivity.java') return p; } })(path.resolve(dir,'..').length>1 ? dir : dir) ||
  (function find(d,depth){ if(depth>4) return; for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    if (e.name==='node_modules'||e.name==='.git') continue;
    const p = path.join(d,e.name);
    if (e.isDirectory()) { const r = find(p,depth+1); if (r) return r; }
    else if (e.name==='MainActivity.java') return p; } })(path.resolve(dir,'..'),0);
if (!java) warn('MainActivity.java not found nearby (skipped)');
else if (fs.existsSync(path.join(dir,'index.html'))) {
  const j = fs.readFileSync(java,'utf8');
  const allowed = new Set([...j.matchAll(/name\.equals\("([^"]+)"\)/g)].map(m => m[1]));
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"':?#]+\.(?:js|css|png|jpg|webp|svg|woff2?|ttf))(?:\?[^"']*)?["']/g)].map(m => m[1]);
  const notAllowed = [...new Set(refs)].filter(r => !allowed.has(r));
  notAllowed.length ? bad('referenced but blocked by Android whitelist (404): ' + notAllowed.join(', ')) : ok('all referenced files allowed (' + [...allowed].join(', ') + ')');
}

console.log('6) Basic tab wiring');
if (fs.existsSync(path.join(dir,'index.html'))) {
  const html = read('index.html');
  const tabs = [...html.matchAll(/data-tab=["']([^"']+)["']/g)].map(m => m[1]);
  tabs.forEach(t => new RegExp('<section[^>]*id=["\']' + t + '["\']').test(html) ? ok('tab -> section #' + t) : bad('tab "' + t + '" has no <section id="' + t + '">'));
}

console.log('7) Translations (studioStrings in studio_v15.js)');
if (!fs.existsSync(path.join(dir, 'studio_v15.js'))) warn('studio_v15.js not found (skipped)');
else {
  const src = read('studio_v15.js');
  const lineOf = i => src.slice(0, i).split('\n').length;
  // Return the {...} literal starting at src[start], skipping braces inside strings.
  const literalAt = start => {
    let depth = 0, quote = '';
    for (let i = start; i < src.length; i++) {
      const c = src[i];
      if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    return null;
  };
  // studioStrings = one literal plus later Object.assign(studioStrings, {...}) blocks.
  const strings = {};
  let blocks = 0, readError = '';
  for (const m of src.matchAll(/(?:var\s+studioStrings\s*=\s*|Object\.assign\(\s*studioStrings\s*,\s*)(?=\{)/g)) {
    const at = m.index + m[0].length, lit = literalAt(at);
    try { Object.assign(strings, vm.runInNewContext('(' + lit + ')', {}, { timeout: 1000 })); blocks++; }
    catch (e) { readError = 'line ' + lineOf(at) + ': ' + e.message; }
  }
  if (readError) bad('cannot read studioStrings (' + readError + ')');
  else if (!blocks) bad('studioStrings not found in studio_v15.js');
  else {
    // 7a) Every key needs non-empty English + Spanish that differ from the Vietnamese key. FAIL.
    const keys = Object.keys(strings);
    let missing = 0;
    for (const k of keys) {
      const v = strings[k], problems = [];
      if (!Array.isArray(v) || v.length < 2) problems.push('needs [English, Spanish]');
      else ['English', 'Spanish'].forEach((name, i) => {
        if (typeof v[i] !== 'string' || !v[i].trim()) problems.push(name + ' is empty');
        else if (v[i] === k) problems.push(name + ' is the same as the Vietnamese key');
      });
      if (problems.length) { missing++; bad('translation "' + k + '": ' + problems.join(', ')); }
    }
    if (!missing) ok(keys.length + ' keys in ' + blocks + ' blocks, all have English + Spanish');
    // 7b) Vietnamese text in notice('...') or aria-label that has no studioStrings key. WARN only.
    const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const literal = (q, body) => { try { return vm.runInNewContext(q + body + q, {}); } catch (e) { return body; } };
    const finders = [
      [/\bnotice\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g, 'notice'],
      [/aria-label=(\\?["'])((?:(?!\1).)*?)\1/g, 'aria-label'],
      [/setAttribute\(\s*['"]aria-label['"]\s*,\s*(?:studioText\(\s*)?(['"])((?:\\.|(?!\1)[^\\])*)\1/g, 'aria-label']
    ];
    let untranslated = 0;
    for (const [re, kind] of finders) for (const m of src.matchAll(re)) {
      const quote = m[1].slice(-1), text = literal(quote, m[2]);
      if (!VI.test(text) || strings[text] || strings[text.trim()]) continue;
      untranslated++;
      warn('line ' + lineOf(m.index) + ' ' + kind + ' not in studioStrings: "' + text + '"');
    }
    if (!untranslated) ok('all Vietnamese notice()/aria-label texts have a studioStrings key');
  }
}

console.log(`\nResult: ${fails} FAIL, ${warns} WARN`);
process.exit(fails ? 1 : 0);
