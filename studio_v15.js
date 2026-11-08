/**
 * AI Creator Studio v1.5 — Prompt Presets + Prompt Vault
 *
 * Non-destructive add-on for v1.4 Multi-AI Beta.
 * Does not alter Gemini requests, keys, image generation or provider routing.
 * Saves ideas/prompts only when user clicks Save; never stores API keys.
 */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const panel = $('ai');
  const idea = $('aiIdea');
  const output = $('aiOutput');
  if (!panel || !idea || !output || $('v15Workspace')) return;

  const KEY = 'acs-v15-prompt-vault';
  const MAX_ITEMS = 30;
  const templates = {
    signage: {
      name: 'Biển quảng cáo / Bảng hiệu',
      idea: `Thiết kế biển quảng cáo chuyên nghiệp.
Nội dung chính: [tên cửa hàng / dịch vụ]
Ngành hàng: [ngành hàng]
Khổ in thực tế: [rộng] × [cao] cm
Tông màu: [màu sắc]
Phong cách: rõ ràng, dễ đọc từ xa, tương phản tốt, bố cục gọn.
Chừa vùng trống cho chữ và logo thật để chèn sau khi tạo ảnh.
Không tự bịa logo, tên, số điện thoại, địa chỉ hay giá.
Chỉ mô tả thiết kế; không khẳng định đã tạo file in hoặc ảnh vector.`
    },
    wedding: {
      name: 'Thiệp / Phông cưới',
      idea: `Lên ý tưởng thiết kế cho đám cưới.
Loại sản phẩm: [thiệp cưới / bảng đón khách / phông nền]
Tên cô dâu – chú rể: [điền chính xác]
Ngày giờ và địa điểm: [điền chính xác]
Kích thước in: [rộng] × [cao] cm
Phong cách: [sang trọng / tối giản / truyền thống / hiện đại]
Màu chủ đạo: [màu]
Ưu tiên hoa văn hài hòa và khoảng trống để ghép chữ chính xác sau.
Không tự tạo tên, ngày tháng hoặc thông tin sự kiện.`
    },
    obituary: {
      name: 'Cáo phó / Thông báo tang lễ',
      idea: `Lên bố cục cáo phó trang trọng, rõ ràng, dễ đọc.
Họ tên người đã mất: [điền chính xác]
Năm sinh – năm mất: [điền chính xác]
Thông tin lễ viếng / an táng: [điền chính xác]
Khổ in: [rộng] × [cao] cm
Phong cách: trang nghiêm, tiết chế họa tiết, chữ có phân cấp rõ.
Giữ nguyên chính xác tên người, ngày giờ và địa điểm do người dùng nhập.
Không tự bịa hoặc suy đoán bất kỳ thông tin cá nhân nào.
Chừa chỗ cho ảnh chân dung nếu được yêu cầu.`
    },
    product: {
      name: 'Ảnh quảng cáo sản phẩm',
      idea: `Thiết kế concept ảnh quảng cáo sản phẩm: [tên sản phẩm]
Đối tượng khách hàng: [mô tả]
Phong cách: ánh sáng thương mại chuyên nghiệp, chủ thể nổi bật.
Bối cảnh: [mô tả], tông màu: [màu sắc]
Tỷ lệ ảnh: [1:1 / 4:5 / 9:16 / 16:9]
Có khoảng trống cho tiêu đề và giá bán chèn sau.
Không bịa nhãn hiệu, công dụng hoặc kết quả chưa được chứng minh.`
    },
    social: {
      name: 'Bài đăng mạng xã hội',
      idea: `Viết ý tưởng nội dung quảng cáo mạng xã hội cho: [sản phẩm/dịch vụ]
Nền tảng: [Facebook / TikTok / Instagram]
Khách hàng mục tiêu: [đối tượng]
Thông điệp chính: [lợi ích có thể xác minh]
Giọng văn: tự nhiên, súc tích, tiếng Việt rõ ràng.
Đề xuất tiêu đề, mô tả hình ảnh và lời kêu gọi hành động.
Không tự bịa khuyến mãi, thông số hoặc thông tin liên hệ.`
    },
    video: {
      name: 'Storyboard video quảng cáo',
      idea: `Lập storyboard video quảng cáo ngắn cho: [sản phẩm/dịch vụ]
Thời lượng dự kiến: [15 / 30 / 45] giây
Tỷ lệ: 9:16, dùng cho video dọc.
Nhân vật / sản phẩm xuyên suốt: [mô tả]
Chia cảnh hợp lý, có thời lượng, hình ảnh, góc máy,
chuyển động, lời dẫn và âm thanh cho từng cảnh.
Kết thúc bằng lời kêu gọi hành động.
Chỉ tạo storyboard/prompt, không tuyên bố đã dựng video.`
    },
    portrait: {
      name: 'Ảnh chân dung phục chế',
      idea: `Lập hướng dẫn biên tập/khôi phục ảnh chân dung dựa trên ảnh gốc.
Mục tiêu: [làm rõ nét / cân màu / sửa vết xước / đổi nền]
Giữ nguyên đặc điểm nhận dạng, biểu cảm và tỷ lệ khuôn mặt thật.
Không tự thêm hoặc thay đổi chi tiết khuôn mặt không có căn cứ.
Không khẳng định nâng DPI sẽ phục hồi chi tiết đã mất.
Nếu dùng AI, ưu tiên bảo toàn tính chân thực và kiểm tra bản gốc.`
    }
  };

  const html = `
  <h3>🧩 Mẫu công việc & Kho prompt — v1.5</h3>
  <p class="v15-note">Mẫu có sẵn để hỗ trợ in ấn, quảng cáo và sáng tạo nội dung. Dùng được với Free, Gemini và chế độ sao chép sang các AI khác.</p>
  <div class="v15-row">
    <label for="v15Preset">Chọn mẫu / Preset
      <select id="v15Preset"></select>
    </label>
    <button type="button" id="v15Apply">Thêm mẫu vào ý tưởng</button>
  </div>
  <p class="v15-note">Mẫu chỉ bổ sung nội dung vào ô Ý tưởng; không xóa nội dung đã nhập. Cần thay các mục [trong ngoặc] bằng thông tin thật.</p>
  <div class="v15-row v15-actions">
    <button type="button" id="v15Save">Lưu ý tưởng / kết quả</button>
    <button type="button" id="v15Export">Tải TXT</button>
  </div>
  <div class="v15-row">
    <label for="v15History">Kho prompt trên thiết bị
      <select id="v15History"></select>
    </label>
    <button type="button" id="v15Load">Mở bản đã lưu</button>
  </div>
  <div class="v15-actions">
    <button type="button" id="v15Delete">Xóa mục đã chọn</button>
    <button type="button" id="v15Clear">Xóa tất cả bản lưu</button>
  </div>
  <p id="v15Status" class="v15-note" role="status" aria-live="polite"></p>
  <p class="v15-note">Chỉ lưu khi bấm “Lưu”. Dữ liệu được lưu ngay trên trình duyệt này, không đồng bộ lên đám mây. Không lưu API key; không nên lưu thông tin riêng tư trên thiết bị dùng chung.</p>`;

  const box = document.createElement('div');
  box.id = 'v15Workspace';
  box.className = 'v15-workspace';
  box.innerHTML = html; // Static markup only. User-entered content uses textContent/value.
  const imageArea = $('multiGeminiImage');
  if (imageArea && imageArea.parentNode === panel) {
    panel.insertBefore(box, imageArea);
  } else {
    panel.append(box);
  }
  const styles = document.createElement('style');
  styles.textContent = `
    .v15-workspace{border:1px solid #40516c;background:#101d30;border-radius:13px;padding:16px;margin:20px 0}
    .v15-workspace h3{margin:0 0 9px;color:#8be0e7}
    .v15-workspace .v15-note{font-size:.88rem;line-height:1.5;margin:10px 0;color:#b7c5d9}
    .v15-workspace .v15-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;margin:12px 0}
    .v15-workspace .v15-actions{display:flex;flex-wrap:wrap;gap:10px}
    .v15-workspace button{white-space:normal}
    .v15-workspace #v15Status{min-height:18px}
    @media(max-width:620px){.v15-workspace .v15-row{grid-template-columns:1fr}
      .v15-workspace .v15-actions button{flex:1 1 150px}}
  `;
  document.head.append(styles);

  const preset = $('v15Preset');
  preset.add(new Option('— Chọn một mẫu —', ''));
  Object.entries(templates).forEach(([id, item]) => preset.add(new Option(item.name, id)));

  let vault = [];
  const status = message => { $('v15Status').textContent = message; };
  const serialize = () => JSON.stringify(vault);
  function readVault() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(data) ? data
        .filter(item => item && typeof item.id === 'string' &&
          typeof item.idea === 'string' && typeof item.result === 'string')
        .slice(0, MAX_ITEMS) : [];
    } catch {
      status('Không đọc được lịch sử trên trình duyệt này.');
      return [];
    }
  }
  function writeVault() {
    try { localStorage.setItem(KEY, serialize()); return true; }
    catch {
      status('Không lưu được. Có thể bộ nhớ trình duyệt bị khóa hoặc đã đầy.');
      return false;
    }
  }
  function renderVault(preferredId = '') {
    const history = $('v15History');
    history.replaceChildren();
    history.add(new Option(vault.length ? '— Chọn bản lưu —' : '— Chưa có bản lưu —', ''));
    for (const item of vault) {
      const stamp = new Date(item.date);
      const time = Number.isNaN(stamp.getTime()) ? 'Không rõ ngày' :
        stamp.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
      const heading = (item.idea || item.result).replace(/\s+/g, ' ').trim().slice(0, 52);
      history.add(new Option(`${time} · ${heading}`, item.id));
    }
    if (preferredId && vault.some(x => x.id === preferredId)) history.value = preferredId;
  }

  $('v15Apply').addEventListener('click', () => {
    const item = templates[preset.value];
    if (!item) { status('Chọn một mẫu trước.'); return; }
    const current = idea.value.trim();
    if (current.includes(item.idea)) {
      status('Mẫu này đã có trong ô Ý tưởng.');
      return;
    }
    idea.value = current ? `${current}\n\n---\n${item.idea}` : item.idea;
    idea.focus();
    status('Đã thêm mẫu. Hãy sửa các ô [thông tin] rồi chạy chế độ AI mong muốn.');
  });

  $('v15Save').addEventListener('click', () => {
    const textIdea = idea.value.trim(), textResult = output.value.trim();
    if (!textIdea && !textResult) { status('Chưa có ý tưởng hoặc kết quả để lưu.'); return; }
    const record = {
      id: (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString(),
      provider: $('aiProvider')?.value || '',
      task: $('aiTask')?.value || '',
      idea: textIdea,
      result: textResult
    };
    const prior = vault.slice();
    vault.unshift(record);
    vault = vault.slice(0, MAX_ITEMS);
    if (!writeVault()) { vault = prior; return; }
    renderVault(record.id);
    status(`Đã lưu trong trình duyệt (${vault.length}/${MAX_ITEMS} bản).`);
  });

  $('v15Load').addEventListener('click', () => {
    const record = vault.find(item => item.id === $('v15History').value);
    if (!record) { status('Chọn bản lưu trước.'); return; }
    if ((idea.value.trim() || output.value.trim()) &&
      !window.confirm('Mở bản lưu sẽ thay nội dung Ý tưởng và Kết quả đang hiển thị. Tiếp tục?')) return;
    idea.value = record.idea;
    output.value = record.result;
    const provider = $('aiProvider');
    const task = $('aiTask');
    if (provider && [...provider.options].some(x => x.value === record.provider)) {
      provider.value = record.provider;
      provider.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (task && [...task.options].some(x => x.value === record.task)) task.value = record.task;
    status('Đã mở bản lưu. API key không được lưu hoặc khôi phục.');
  });

  $('v15Delete').addEventListener('click', () => {
    const id = $('v15History').value;
    if (!id) { status('Chọn bản lưu cần xóa.'); return; }
    if (!window.confirm('Xóa bản lưu này khỏi trình duyệt?')) return;
    const prior = vault.slice();
    vault = vault.filter(item => item.id !== id);
    if (!writeVault()) { vault = prior; return; }
    renderVault();
    status('Đã xóa bản lưu được chọn.');
  });

  $('v15Clear').addEventListener('click', () => {
    if (!vault.length) { status('Kho prompt đang trống.'); return; }
    if (!window.confirm(`Xóa toàn bộ ${vault.length} bản lưu trong trình duyệt?`)) return;
    const prior = vault.slice();
    vault = [];
    if (!writeVault()) { vault = prior; return; }
    renderVault();
    status('Đã xóa toàn bộ bản lưu v1.5.');
  });

  $('v15Export').addEventListener('click', () => {
    const textIdea = idea.value.trim(), textResult = output.value.trim();
    if (!textIdea && !textResult) { status('Chưa có nội dung để tải TXT.'); return; }
    const content = [
      'AI Creator Studio v1.5',
      `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`,
      `Chế độ: ${$('aiProvider')?.value || ''}`,
      `Tác vụ: ${$('aiTask')?.value || ''}`,
      '',
      '=== Ý TƯỞNG ===', textIdea,
      '',
      '=== KẾT QUẢ ===', textResult,
      ''
    ].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-creator-studio-prompt-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    status('Đã tạo tệp TXT (không chứa API key).');
  });

  vault = readVault();
  renderVault();
})();


/* ZUNVA Studio MVP — local-first, editable offline designs. Isolated from v1.5 tools. */
(function () {
  'use strict';
  function ready() {
    var main = document.querySelector('main');
    var nav = main && main.querySelector('nav');
    if (!main || !nav || document.getElementById('zunva')) return;
    var $ = function (id) { return document.getElementById(id); };
    var deep = function (obj) { return JSON.parse(JSON.stringify(obj)); };
    var SAVED_KEY = 'zunva_studio_projects_v1';
    var seq = 1, currentId = '', selectedId = '', doc = null, undo = [], redo = [], dragging = null;
    var templates = [
      {id:'sale',name:'Poster khuyến mãi',kind:'Quảng cáo',css:'z-tpl-sale',preview:'SIÊU SALE',sub:'ƯU ĐÃI 50%',a:'#37154f',b:'#f44385',ink:'#ffffff',layers:[
        {text:'SIÊU SALE',x:.5,y:.26,size:106,color:'#ffffff',weight:900},
        {text:'GIẢM ĐẾN 50%',x:.5,y:.50,size:75,color:'#ffed85',weight:900},
        {text:'Ưu đãi dành riêng cho bạn',x:.5,y:.76,size:36,color:'#ffffff',weight:600}]},
      {id:'wedding',name:'Thiệp cưới tinh tế',kind:'Cưới hỏi',css:'z-tpl-wedding',preview:'SAVE THE DATE',sub:'THE WEDDING',a:'#fdf6ed',b:'#e7b7c6',ink:'#713e58',layers:[
        {text:'Trân trọng kính mời',x:.5,y:.25,size:39,color:'#713e58',weight:500},
        {text:'Minh & An',x:.5,y:.46,size:101,color:'#70374f',weight:700},
        {text:'Ngày 20 · 12 · 2026',x:.5,y:.71,size:43,color:'#713e58',weight:600}]},
      {id:'memory',name:'Thông báo cáo phó',kind:'In ấn',css:'z-tpl-memory',preview:'THÀNH KÍNH',sub:'PHÂN ƯU',a:'#faf7f0',b:'#d6ddd5',ink:'#2b3d3e',layers:[
        {text:'THÀNH KÍNH PHÂN ƯU',x:.5,y:.25,size:56,color:'#2b3d3e',weight:700},
        {text:'THÔNG BÁO',x:.5,y:.48,size:76,color:'#35454a',weight:800},
        {text:'Nội dung chỉnh sửa tại đây',x:.5,y:.71,size:33,color:'#596767',weight:500}]},
      {id:'social',name:'Bài đăng mạng xã hội',kind:'Social',css:'z-tpl-social',preview:'CREATE MORE',sub:'INSPIRE EVERY DAY',a:'#12224e',b:'#079ca4',ink:'#ffffff',layers:[
        {text:'Ý TƯỞNG MỚI',x:.5,y:.27,size:90,color:'#ffffff',weight:900},
        {text:'KHỞI ĐẦU MỚI',x:.5,y:.48,size:63,color:'#9cfff0',weight:800},
        {text:'Sáng tạo mỗi ngày',x:.5,y:.76,size:39,color:'#ffffff',weight:500}]},
      {id:'menu',name:'Menu sản phẩm',kind:'Quán ăn',css:'z-tpl-menu',preview:'THỰC ĐƠN',sub:'MÓN NGON HÔM NAY',a:'#ffd77d',b:'#ec8745',ink:'#52361f',layers:[
        {text:'MÓN NGON HÔM NAY',x:.5,y:.26,size:65,color:'#6b3b22',weight:900},
        {text:'COMBO 99K',x:.5,y:.50,size:104,color:'#ffffff',weight:900},
        {text:'Đặt hàng ngay hôm nay',x:.5,y:.75,size:34,color:'#61391f',weight:600}]}
    ];
    function tr(vi, en) { return $('language') && $('language').value === 'vi' ? vi : en; }
    var tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'tab'; tab.id = 'navZunva'; tab.dataset.tab = 'zunva';
    tab.textContent = '✦ ZUNVA Studio'; nav.insertBefore(tab, nav.firstChild);
    var panel = document.createElement('section');
    panel.id = 'zunva'; panel.className = 'z-panel';
    panel.innerHTML = [
      '<div id="z-home">',
      '<div class="z-hero"><div class="z-brand">✦ ZUNVA / CREATOR STUDIO</div>',
      '<h2>Biến ý tưởng thành thiết kế của bạn.</h2>',
      '<p>Chọn mẫu có sẵn hoặc bắt đầu từ trang trắng. Kéo thả chữ, chỉnh từng lớp và xuất ảnh — miễn phí, không cần API key.</p>',
      '<div class="z-hero-actions"><button type="button" class="z-mainbtn" id="z-new">✦ Bắt đầu thiết kế</button>',
      '<button type="button" class="z-softbtn" id="z-jump">Khám phá mẫu ↓</button></div>',
      '<div class="z-pillstrip"><span>✓ Không cần AI key</span><span>✓ Lưu bản sửa được</span><span>✓ Xuất PNG</span></div></div>',
      '<div class="z-section-title" id="z-templates"><div><h3>Bắt đầu từ một mẫu</h3>',
      '<p>Chạm vào mẫu để mở xưởng thiết kế.</p></div></div>',
      '<div class="z-gallery" id="z-gallery"></div>',
      '<div class="z-projects"><h3>Thiết kế của bạn</h3><div id="z-project-list"></div></div>',
      '<p class="z-privacy">Dữ liệu chỉ lưu trên thiết bị này. Hãy xuất PNG để chia sẻ; đây là xưởng thiết kế thử nghiệm.</p></div>',
      '<div id="z-editor" class="z-hidden"><div class="z-editor-shell">',
      '<div class="z-editor-heading"><button type="button" class="z-softbtn" id="z-back">← Kho mẫu</button>',
      '<h3>Xưởng thiết kế</h3><span style="font-size:12px;color:#a5b9d4">Chạm và kéo chữ để di chuyển</span></div>',
      '<div class="z-toolbar" style="margin-bottom:13px">',
      '<button type="button" class="z-mainbtn" id="z-add">+ Thêm chữ</button>',
      '<button type="button" class="z-smallbtn" id="z-undo">↶ Hoàn tác</button>',
      '<button type="button" class="z-smallbtn" id="z-redo">↷ Làm lại</button>',
      '<button type="button" class="z-smallbtn" id="z-export">↓ Xuất PNG</button></div>',
      '<div class="z-editor-grid"><div class="z-canvas-panel"><canvas id="z-canvas" width="1080" height="1350" aria-label="Vùng thiết kế kéo thả chữ"></canvas>',
      '<div class="z-canvas-hint">Chạm vào dòng chữ trên ảnh để chọn · Kéo để di chuyển</div></div>',
      '<div class="z-controls">',
      '<div class="z-control-box"><h4>Chữ đang chọn</h4>',
      '<label>Nội dung<input id="z-text" maxlength="100" placeholder="Chọn hoặc thêm chữ"></label>',
      '<div class="z-input-row"><label>Cỡ chữ<input id="z-font" type="number" min="14" max="220" step="1"></label>',
      '<label>Màu chữ<br><input id="z-color" type="color" value="#ffffff"></label></div>',
      '<button type="button" class="z-smallbtn" id="z-remove">Xóa chữ đã chọn</button></div>',
      '<div class="z-control-box"><h4>Lớp thiết kế</h4><div class="z-layer-list" id="z-layers"></div></div>',
      '<div class="z-control-box"><h4>Khổ thiết kế & in ấn</h4>',
      '<div class="z-input-row"><label>Rộng (px)<input id="z-width" type="number" min="480" max="3000"></label>',
      '<label>Cao (px)<input id="z-height" type="number" min="480" max="3000"></label></div>',
      '<label>DPI tham chiếu<input id="z-dpi" type="number" min="72" max="600" value="150"></label>',
      '<div id="z-print-info" style="font-size:12px;color:#a9d9dd"></div>',
      '<p style="font-size:11px;color:#97a9c4">DPI dùng để tính khổ in, PNG chưa gắn metadata DPI.</p></div>',
      '<div class="z-control-box"><h4>Lưu bản có thể chỉnh sửa</h4>',
      '<label>Tên thiết kế<input id="z-name" maxlength="60" placeholder="Thiết kế của tôi"></label>',
      '<div class="z-toolbar"><button type="button" class="z-mainbtn" id="z-save">Lưu thiết kế</button>',
      '<button type="button" class="z-smallbtn" id="z-exportjson">Xuất dự án JSON</button></div></div>',
      '</div></div><div class="z-status" id="z-status" role="status" aria-live="polite"></div></div></div>'
    ].join('');
    nav.after(panel);
    var cv = $('z-canvas'), ctx = cv.getContext('2d');
    function viewTab() {
      Array.prototype.forEach.call(nav.querySelectorAll('[data-tab]'), function (b) {
        b.classList.toggle('active', b === tab);
      });
      Array.prototype.forEach.call(main.querySelectorAll('section'), function (s) {
        s.classList.toggle('hidden', s !== panel);
      });
    }
    tab.addEventListener('click', viewTab);
    $('language').addEventListener('change', function () { /* Existing translations untouched. */ });
    function blank() {
      return {version:1, name:'Thiết kế mới', width:1080, height:1350, dpi:150, bg:['#14264d','#2383a5'], layers:[]};
    }
    function fromTemplate(t) {
      var d = blank(); d.name = t.name; d.bg = [t.a,t.b];
      d.layers = t.layers.map(function (l) { var x=deep(l);x.id='z'+seq++;return x; });
      return d;
    }
    function notice(msg) { $('z-status').textContent = msg; }
    function historyBefore() {
      if (!doc) return; undo.push(JSON.stringify(doc)); if (undo.length>30) undo.shift(); redo=[];
    }
    function select(id) { selectedId=id; controls(); draw(); }
    function controls() {
      var l = doc && doc.layers.find(function (x) {return x.id===selectedId;});
      $('z-text').value=l?l.text:'';
      $('z-font').value=l?l.size:'';
      $('z-color').value=l?l.color:'#ffffff';
      $('z-text').disabled=!l; $('z-font').disabled=!l; $('z-color').disabled=!l;
      $('z-remove').disabled=!l;
      if(doc){ $('z-name').value=doc.name;$('z-width').value=doc.width;$('z-height').value=doc.height;$('z-dpi').value=doc.dpi; }
      $('z-undo').disabled=!undo.length;$('z-redo').disabled=!redo.length;
      var box=$('z-layers');box.replaceChildren();
      if(doc){
        doc.layers.slice().reverse().forEach(function(layer){
          var row=document.createElement('div');row.className='z-layer'+(layer.id===selectedId?' z-selected':'');
          var title=document.createElement('button');title.type='button';title.className='z-layer-title';title.textContent=layer.text||'(Chữ trống)';
          title.onclick=function(){ select(layer.id); };
          row.append(title);
          [['↑','up'],['↓','down'],['×','delete']].forEach(function(pair){
            var b=document.createElement('button');b.type='button';b.textContent=pair[0];b.title=pair[1];
            b.onclick=function(){
              var i=doc.layers.findIndex(function(x){return x.id===layer.id;});
              if(i<0)return;
              if(pair[1]==='up'&&i>=doc.layers.length-1)return;
              if(pair[1]==='down'&&i<=0)return;
              historyBefore();
              if(pair[1]==='delete') {doc.layers.splice(i,1);if(selectedId===layer.id) selectedId='';}
              else {var j=i+(pair[1]==='up'?1:-1);var temp=doc.layers[j];doc.layers[j]=doc.layers[i];doc.layers[i]=temp;}
              controls();draw();
            };row.append(b);
          });
          box.append(row);
        });
      }
      var w=doc?doc.width:1080, h=doc?doc.height:1350, dpi=doc?doc.dpi:150;
      $('z-print-info').textContent= 'Khổ in tương đương: '+(w/dpi*2.54).toFixed(1)+' × '+(h/dpi*2.54).toFixed(1)+' cm';
    }
    function draw(showSelection) {
      if(!doc)return;
      cv.width=doc.width;cv.height=doc.height;
      var w=cv.width,h=cv.height;
      var g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,doc.bg[0]);g.addColorStop(1,doc.bg[1]);
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      ctx.save();ctx.globalAlpha=.09;ctx.strokeStyle='#ffffff';ctx.lineWidth=w*.002;
      [0.28,0.48,0.70].forEach(function(scale){ctx.beginPath();ctx.arc(w*.95,h*.10,w*scale,0,Math.PI*2);ctx.stroke();});
      ctx.restore();
      doc.layers.forEach(function(l){
        ctx.font=String(l.weight||700)+' '+Math.round(l.size*w/1080)+'px Arial, sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        var x=l.x*w,y=l.y*h;
        ctx.fillStyle=l.color||'#ffffff';
        ctx.fillText(l.text,x,y,w*.9);
        if(showSelection!==false && selectedId===l.id){
          var tw=Math.min(ctx.measureText(l.text).width,w*.9);
          var bh=l.size*w/1080*1.23;
          ctx.strokeStyle='#7ff6de';ctx.lineWidth=Math.max(2,w*.003);
          ctx.setLineDash([w*.008,w*.005]);ctx.strokeRect(x-tw/2-10,y-bh/2-8,tw+20,bh+16);ctx.setLineDash([]);
        }
      });
    }
    function point(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*cv.width,y:(e.clientY-r.top)/r.height*cv.height};}
    function hit(p){
      for(var i=doc.layers.length-1;i>=0;i--){
        var l=doc.layers[i];ctx.font=String(l.weight||700)+' '+Math.round(l.size*cv.width/1080)+'px Arial';
        var tw=Math.min(ctx.measureText(l.text).width,cv.width*.9);
        var bh=l.size*cv.width/1080*1.5;
        if(Math.abs(p.x-l.x*cv.width)<tw/2+22 && Math.abs(p.y-l.y*cv.height)<bh/2+18)return l;
      }
      return null;
    }
    cv.addEventListener('pointerdown',function(e){
      if(!doc)return;
      var p=point(e),l=hit(p);
      if(!l){select('');return;}
      selectedId=l.id;controls();draw();
      dragging={id:l.id,prior:JSON.stringify(doc),dx:p.x/cv.width-l.x,dy:p.y/cv.height-l.y};
      cv.classList.add('z-dragging'); if(cv.setPointerCapture)cv.setPointerCapture(e.pointerId);e.preventDefault();
    });
    cv.addEventListener('pointermove',function(e){
      if(!dragging||!doc)return;
      var l=doc.layers.find(function(x){return x.id===dragging.id;});if(!l)return;
      var p=point(e);
      l.x=Math.max(.04,Math.min(.96,p.x/cv.width-dragging.dx));
      l.y=Math.max(.04,Math.min(.96,p.y/cv.height-dragging.dy));
      draw();e.preventDefault();
    });
    function stopDrag(){
      if(!dragging)return;
      if(JSON.stringify(doc)!==dragging.prior) {
        undo.push(dragging.prior); if(undo.length>30)undo.shift();redo=[];controls();
      }
      dragging=null;cv.classList.remove('z-dragging');
    }
    cv.addEventListener('pointerup',stopDrag);cv.addEventListener('pointercancel',stopDrag);
    function openEditor(d,id){
      doc=deep(d); currentId=id||'';selectedId=doc.layers.length?doc.layers[doc.layers.length-1].id:'';
      undo=[];redo=[];
      $('z-home').classList.add('z-hidden');$('z-editor').classList.remove('z-hidden');
      viewTab();controls();draw();
      notice('Chỉnh chữ, di chuyển rồi lưu dự án. Không cần tài khoản hoặc API key.');
      window.scrollTo({top:0,behavior:'smooth'});
    }
    var gallery=$('z-gallery');
    templates.forEach(function(t){
      var b=document.createElement('button');b.className='z-template';b.type='button';
      b.innerHTML='<div class="z-template-preview '+t.css+'"><strong></strong><small></small></div><div class="z-template-info"><b></b><small></small></div>';
      b.querySelector('strong').textContent=t.preview;
      b.querySelector('.z-template-preview small').textContent=t.sub;
      b.querySelector('.z-template-info b').textContent=t.name;
      b.querySelector('.z-template-info small').textContent=t.kind+' · Có thể chỉnh sửa';
      b.onclick=function(){openEditor(fromTemplate(t));};gallery.append(b);
    });
    $('z-new').onclick=function(){openEditor(blank());};
    $('z-jump').onclick=function(){$('z-templates').scrollIntoView({behavior:'smooth',block:'start'});};
    $('z-back').onclick=function(){
      $('z-editor').classList.add('z-hidden');$('z-home').classList.remove('z-hidden');
      renderSaved();window.scrollTo({top:0,behavior:'smooth'});
    };
    $('z-add').onclick=function(){
      if(!doc)return;historyBefore();
      var l={id:'z'+seq++,text:tr('Chữ mới','New text'),x:.5,y:.5,size:65,color:'#ffffff',weight:700};
      doc.layers.push(l);select(l.id);
    };
    [['z-text','text'],['z-font','size'],['z-color','color']].forEach(function(pair){
      $(pair[0]).addEventListener('change',function(){
        var l=doc&&doc.layers.find(function(x){return x.id===selectedId;});if(!l)return;
        var v=pair[1]==='size'?Math.max(14,Math.min(220,Number(this.value)||50)):this.value;
        if(l[pair[1]]===v)return;historyBefore();l[pair[1]]=v;controls();draw();
      });
    });
    $('z-remove').onclick=function(){
      if(!doc||!selectedId)return;historyBefore();
      doc.layers=doc.layers.filter(function(x){return x.id!==selectedId;});
      select(doc.layers.length?doc.layers[doc.layers.length-1].id:'');
    };
    $('z-undo').onclick=function(){if(!undo.length)return;redo.push(JSON.stringify(doc));doc=JSON.parse(undo.pop());controls();draw();};
    $('z-redo').onclick=function(){if(!redo.length)return;undo.push(JSON.stringify(doc));doc=JSON.parse(redo.pop());controls();draw();};
    [['z-width','width',480,3000],['z-height','height',480,3000],['z-dpi','dpi',72,600]].forEach(function(p){
      $(p[0]).addEventListener('change',function(){
        if(!doc)return;var n=Math.max(p[2],Math.min(p[3],Math.round(Number(this.value)||doc[p[1]])));
        if(n===doc[p[1]])return;historyBefore();doc[p[1]]=n;controls();draw();
      });
    });
    function download(url,filename){
      var a=document.createElement('a');a.download=filename;a.href=url;document.body.append(a);a.click();a.remove();
    }
    $('z-export').onclick=function(){
      if(!doc)return;
      draw(false);
      try{
        var data=cv.toDataURL('image/png');
        if(window.AndroidImageSaver&&typeof window.AndroidImageSaver.saveImage==='function')
          window.AndroidImageSaver.saveImage(data,'zunva-'+Date.now()+'.png');
        else download(data,'zunva-'+Date.now()+'.png');
        notice('Đã tạo PNG. Mở ảnh trong thư viện hoặc thư mục Tải xuống.');
      }catch(e){notice('Không xuất được PNG. Thử giảm kích thước thiết kế.');}
      draw();
    };
    function readSaved(){
      try{var a=JSON.parse(localStorage.getItem(SAVED_KEY)||'[]');return Array.isArray(a)?a:[];}
      catch(e){return [];}
    }
    function writeSaved(a) {try{localStorage.setItem(SAVED_KEY,JSON.stringify(a.slice(0,12)));return true;}catch(e){return false;}}
    $('z-save').onclick=function(){
      if(!doc)return;
      doc.name=($('z-name').value||'Thiết kế ZUNVA').trim().slice(0,60);
      var a=readSaved();
      if(!currentId)currentId='project-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
      a=a.filter(function(p){return p.id!==currentId;});
      a.unshift({id:currentId,saved:new Date().toISOString(),design:deep(doc)});
      notice(writeSaved(a)?'Đã lưu bản chỉnh sửa trên thiết bị.':'Không lưu được: bộ nhớ trình duyệt bị chặn hoặc đã đầy.');
    };
    $('z-exportjson').onclick=function(){
      if(!doc)return;
      var blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});
      var url=URL.createObjectURL(blob);
      download(url,'zunva-project-'+Date.now()+'.json');setTimeout(function(){URL.revokeObjectURL(url);},5000);
      notice('Đã tạo bản sao JSON để lưu trữ.');
    };
    function renderSaved(){
      var node=$('z-project-list');node.replaceChildren();
      var a=readSaved();
      if(!a.length){node.textContent='Chưa có thiết kế đã lưu trên thiết bị này.';return;}
      a.forEach(function(item){
        var row=document.createElement('div');row.className='z-project-row';
        var title=document.createElement('span');title.textContent=(item.design&&item.design.name)||'Thiết kế';
        var open=document.createElement('button');open.type='button';open.textContent='Mở';
        open.onclick=function(){if(item.design&&Array.isArray(item.design.layers))openEditor(item.design,item.id);};
        var del=document.createElement('button');del.type='button';del.textContent='Xóa';
        del.onclick=function(){if(window.confirm('Xóa bản lưu này?')){writeSaved(readSaved().filter(function(x){return x.id!==item.id;}));renderSaved();}};
        row.append(title,open,del);node.append(row);
      });
    }
    renderSaved();viewTab();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
