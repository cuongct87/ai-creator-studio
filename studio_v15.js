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
    var dirty = false;
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
      {id:'social',name:'Bài đăng mạng xã hội',kind:'Mạng xã hội',css:'z-tpl-social',preview:'CREATE MORE',sub:'INSPIRE EVERY DAY',a:'#12224e',b:'#079ca4',ink:'#ffffff',layers:[
        {text:'Ý TƯỞNG MỚI',x:.5,y:.27,size:90,color:'#ffffff',weight:900},
        {text:'KHỞI ĐẦU MỚI',x:.5,y:.48,size:63,color:'#9cfff0',weight:800},
        {text:'Sáng tạo mỗi ngày',x:.5,y:.76,size:39,color:'#ffffff',weight:500}]},
      {id:'menu',name:'Menu sản phẩm',kind:'Quán ăn',css:'z-tpl-menu',preview:'THỰC ĐƠN',sub:'MÓN NGON HÔM NAY',a:'#ffd77d',b:'#ec8745',ink:'#52361f',layers:[
        {text:'MÓN NGON HÔM NAY',x:.5,y:.26,size:65,color:'#6b3b22',weight:900},
        {text:'COMBO 99K',x:.5,y:.50,size:104,color:'#ffffff',weight:900},
        {text:'Đặt hàng ngay hôm nay',x:.5,y:.75,size:34,color:'#61391f',weight:600}]}
    ];
    // Studio-only translations. Artwork text and saved project data are never modified.
    var studioStrings={"Biến ý tưởng thành thiết kế của bạn.":["Turn ideas into designs.","Convierte ideas en diseños."],"Chọn mẫu có sẵn hoặc bắt đầu từ trang trắng. Kéo thả chữ, chỉnh từng lớp và xuất ảnh — miễn phí, không cần API key.":["Start with a template or a blank canvas. Drag text and photos, edit layers and export images — free, no API key required.","Empieza con una plantilla o un lienzo vacío. Arrastra texto e imágenes, edita capas y exporta diseños, gratis y sin clave API."],"✦ Bắt đầu thiết kế":["✦ Start designing","✦ Empezar a diseñar"],"Khám phá mẫu ↓":["Explore templates ↓","Explorar plantillas ↓"],"✓ Không cần AI key":["✓ No AI key","✓ Sin clave de IA"],"✓ Lưu bản sửa được":["✓ Editable projects","✓ Proyectos editables"],"✓ Xuất PNG":["✓ Export PNG","✓ Exportar PNG"],"Bạn muốn thiết kế gì?":["What would you like to design?","¿Qué quieres diseñar?"],"Tìm poster, thiệp cưới, cáo phó, menu...":["Search posters, invitations, notices, menus...","Busca carteles, invitaciones, avisos, menús..."],"Tiếp tục thiết kế":["Continue designing","Seguir diseñando"],"Dự án trên thiết bị này · Chạm để mở lại và chỉnh sửa.":["Saved on this device · Tap to reopen and edit.","Guardados en este dispositivo · Toca para editar."],"Chọn cách bắt đầu":["Choose how to start","Elige cómo empezar"],"Một thao tác là đến đúng công cụ bạn cần.":["Pick a starting point to get to work.","Elige una opción para empezar."],"Trang trắng":["Blank canvas","Lienzo en blanco"],"Tự do sáng tạo từ đầu":["Create from scratch","Crear desde cero"],"Chọn mẫu":["Choose a template","Elegir plantilla"],"Sửa ngay mẫu có sẵn":["Customize an existing design","Personaliza un diseño"],"Thiệp & in ấn":["Cards & print","Tarjetas e impresión"],"Cưới hỏi, cáo phó, quảng cáo":["Weddings, notices, ads","Bodas, avisos, anuncios"],"Ý tưởng bằng AI":["AI ideas","Ideas con IA"],"Mở công cụ AI hiện có":["Open existing AI tools","Abrir herramientas de IA"],"Khám phá mẫu":["Explore templates","Explorar plantillas"],"Chọn mẫu và thay nội dung ngay trong xưởng thiết kế.":["Choose a template and edit it in Studio.","Elige una plantilla y edítala en Studio."],"Tất cả":["All","Todas"],"Quảng cáo":["Advertising","Publicidad"],"Cưới hỏi":["Weddings","Bodas"],"In ấn":["Print","Impresión"],"Mạng xã hội":["Social media","Redes sociales"],"Quán ăn":["Food & menus","Comida y menús"],"Không tìm thấy mẫu phù hợp. Thử từ khóa khác hoặc bắt đầu từ trang trắng.":["No matching templates. Try another search or start blank.","No hay plantillas. Prueba otra búsqueda o empieza desde cero."],"Dữ liệu chỉ lưu trên thiết bị này. Hãy xuất PNG để chia sẻ; đây là xưởng thiết kế thử nghiệm.":["Designs stay on this device. Export PNG to share. This editor is a preview.","Los diseños se guardan aquí. Exporta PNG para compartir. Este editor está en pruebas."],"← Trang chủ":["← Home","← Inicio"],"Xưởng thiết kế":["Design editor","Editor de diseño"],"Chạm và kéo chữ để di chuyển":["Touch and drag text to move","Toca y arrastra texto"],"+ Thêm chữ":["+ Add text","+ Añadir texto"],"↶ Hoàn tác":["↶ Undo","↶ Deshacer"],"↷ Làm lại":["↷ Redo","↷ Rehacer"],"↓ Xuất PNG":["↓ Export PNG","↓ Exportar PNG"],"Chạm vào dòng chữ trên ảnh để chọn · Kéo để di chuyển":["Tap to select text or photo · Drag to move","Toca para seleccionar texto o imagen · Arrastra para mover"],"Chữ đang chọn":["Selected text","Texto seleccionado"],"Nội dung":["Text","Contenido"],"Cỡ chữ":["Font size","Tamaño de letra"],"Màu chữ":["Text color","Color del texto"],"Xóa chữ đã chọn":["Delete selected text","Eliminar texto"],"Lớp thiết kế":["Layers","Capas"],"Khổ thiết kế & in ấn":["Canvas size & print","Tamaño e impresión"],"Rộng (px)":["Width (px)","Ancho (px)"],"Cao (px)":["Height (px)","Alto (px)"],"DPI tham chiếu":["Reference DPI","PPP de referencia"],"DPI dùng để tính khổ in, PNG chưa gắn metadata DPI.":["DPI estimates print size; exported PNG has no embedded DPI.","Los PPP estiman el tamaño de impresión; el PNG no incluye PPP."],"Lưu bản có thể chỉnh sửa":["Save editable project","Guardar proyecto editable"],"Tên thiết kế":["Design name","Nombre del diseño"],"Lưu thiết kế":["Save design","Guardar diseño"],"Xuất dự án JSON":["Export project JSON","Exportar JSON del proyecto"],"Thiết kế của tôi":["My design","Mi diseño"],"Chọn hoặc thêm chữ":["Select or add text","Selecciona o añade texto"],"+ Thêm ảnh":["+ Add photo","+ Añadir imagen"],"Ảnh đang chọn":["Selected photo","Imagen seleccionada"],"Chiều rộng ảnh (% khổ thiết kế)":["Photo width (% of canvas)","Ancho de foto (% del lienzo)"],"Ảnh được giữ tỉ lệ · Chạm và kéo trên canvas":["Aspect ratio locked · Drag on canvas","Proporción fija · Arrastra en el lienzo"],"Xóa ảnh đã chọn":["Delete selected photo","Eliminar imagen"],"Nhập dự án JSON":["Import project JSON","Importar JSON del proyecto"],"Poster khuyến mãi":["Sale poster","Cartel de ofertas"],"Thiệp cưới tinh tế":["Wedding invitation","Invitación de boda"],"Thông báo cáo phó":["Obituary notice","Aviso de fallecimiento"],"Bài đăng mạng xã hội":["Social post","Publicación en redes"],"Menu sản phẩm":["Product menu","Menú de productos"],"Có thể chỉnh sửa":["Editable","Editable"],"Chữ mới":["New text","Texto nuevo"],"(Chữ trống)":["(Empty text)","(Texto vacío)"],"Chưa có bản thiết kế nào. Chọn trang trắng hoặc mẫu để bắt đầu, ZUNVA sẽ lưu lại cho lần sau.":["No saved designs yet. Choose a template or blank canvas to start.","No hay diseños guardados. Elige una plantilla o un lienzo vacío."],"Tiếp tục":["Continue","Continuar"],"Xóa":["Delete","Eliminar"],"Xem trước thiết kế":["Design preview","Vista previa"],"Xóa thiết kế này khỏi thiết bị?":["Delete this design from the device?","¿Eliminar este diseño del dispositivo?"],"Thiết kế":["Design","Diseño"],"Lưu: ":["Saved: ","Guardado: "],"Trên thiết bị":["On device","En el dispositivo"],"Chỉnh chữ, di chuyển rồi lưu dự án. Không cần tài khoản hoặc API key.":["Edit and move layers, then save. No account or API key required.","Edita y mueve capas y luego guarda. Sin cuenta ni clave API."],"Đã lưu! Thiết kế sẽ hiện ở mục Tiếp tục thiết kế.":["Saved! Find it under Continue designing.","¡Guardado! Estará en Seguir diseñando."],"Không lưu được. Hãy xuất JSON để sao lưu trước khi rời xưởng thiết kế.":["Save failed. Export JSON before leaving the editor.","Error al guardar. Exporta JSON antes de salir."],"Không lưu được: dung lượng bộ nhớ đầy. Hãy xuất bản JSON.":["Storage full. Export JSON to back up your project.","Almacenamiento lleno. Exporta JSON como copia."],"Không đọc được ảnh.":["Could not read photo.","No se pudo leer la imagen."],"Chỉ hỗ trợ JPG, PNG, WebP dưới 8 MB.":["Use JPG, PNG or WebP under 8 MB.","Usa JPG, PNG o WebP de menos de 8 MB."],"Đã thêm ảnh. Kéo ảnh trên canvas; chỉnh kích thước ở bảng điều khiển.":["Photo added. Drag to move and resize in controls.","Imagen añadida. Arrastra y cambia el tamaño en los controles."],"Đã tạo PNG. Mở ảnh trong thư viện hoặc thư mục Tải xuống.":["PNG generated. Check Gallery or Downloads.","PNG generado. Mira en Galería o Descargas."],"Ảnh chưa tải xong hoặc bị lỗi; chưa thể xuất PNG.":["Photo not ready; cannot export PNG.","La imagen no está lista; no se puede exportar PNG."],"Ảnh trong dự án bị lỗi, vui lòng thay ảnh.":["Project photo invalid; replace it.","La imagen del proyecto está dañada; cámbiala."],"Khổ in tương đương: ":["Approximate print size: ","Tamaño de impresión aprox.: "]};
    function studioText(vi) {
      var code=$('language')?$('language').value:'vi';
      if(code==='vi')return vi;
      var x=studioStrings[vi];return x?x[code==='es'?1:0]:vi;
    }
    var studioStatic=[],studioPlaceholders=[];
    function recordStudioUI(){
      var walk=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT);
      while(walk.nextNode()){
        var node=walk.currentNode,raw=node.nodeValue;
        if(studioStrings[raw.trim()])studioStatic.push({node:node,raw:raw});
      }
      Array.prototype.forEach.call(panel.querySelectorAll('[placeholder]'),function(el){
        if(studioStrings[el.placeholder])studioPlaceholders.push({el:el,raw:el.placeholder});
      });
    }
    function updateStudioLanguage(){
      studioStatic.forEach(function(entry){
        entry.node.nodeValue=entry.raw.replace(entry.raw.trim(),studioText(entry.raw.trim()));
      });
      studioPlaceholders.forEach(function(entry){entry.el.placeholder=studioText(entry.raw);});
      Array.prototype.forEach.call(gallery.querySelectorAll('.z-template'),function(button,i){
        var t=templates[i];if(!t)return;
        button.querySelector('.z-template-info b').textContent=studioText(t.name);
        button.querySelector('.z-template-info small').textContent=studioText(t.kind)+' · '+studioText('Có thể chỉnh sửa');
      });
      renderSaved();
      if($('z-status').dataset.originalMessage)$('z-status').textContent=studioText($('z-status').dataset.originalMessage);
    }

    function tr(vi, en) { return $('language').value === 'vi' ? vi : studioText(vi); }
    var tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'tab'; tab.id = 'navZunva'; tab.dataset.tab = 'zunva';
    tab.textContent = '✦ ZUNVA Studio'; nav.insertBefore(tab, nav.firstChild);
    var panel = document.createElement('section');
    panel.id = 'zunva'; panel.className = 'z-panel';
    panel.innerHTML = [
      '<div id="z-home">',
      '<div class="z-hero"><div class="z-brand">✦ ZUNVA / CREATOR STUDIO · UX 2.1</div>',
      '<h2>Biến ý tưởng thành thiết kế của bạn.</h2>',
      '<p>Chọn mẫu có sẵn hoặc bắt đầu từ trang trắng. Kéo thả chữ, chỉnh từng lớp và xuất ảnh — miễn phí, không cần API key.</p>',
      '<div class="z-hero-actions"><button type="button" class="z-mainbtn" id="z-new">✦ Bắt đầu thiết kế</button>',
      '<button type="button" class="z-softbtn" id="z-jump">Khám phá mẫu ↓</button></div>',
      '<div class="z-pillstrip"><span>✓ Không cần AI key</span><span>✓ Lưu bản sửa được</span><span>✓ Xuất PNG</span></div></div>',
      '<div class="z-home-search"><label for="z-template-search">Bạn muốn thiết kế gì?</label>',
      '<div class="z-search-input"><span aria-hidden="true">⌕</span><input id="z-template-search" type="search" placeholder="Tìm poster, thiệp cưới, cáo phó, menu..." autocomplete="off"></div></div>',
      '<section class="z-recent" aria-labelledby="z-recent-title"><div class="z-section-title"><div><h3 id="z-recent-title">Tiếp tục thiết kế</h3>',
      '<p>Dự án trên thiết bị này · Chạm để mở lại và chỉnh sửa.</p></div></div>',
      '<div class="z-recent-grid" id="z-project-list"></div></section>',
      '<section class="z-start" aria-labelledby="z-start-title"><div class="z-section-title"><div><h3 id="z-start-title">Chọn cách bắt đầu</h3>',
      '<p>Một thao tác là đến đúng công cụ bạn cần.</p></div></div>',
      '<div class="z-start-grid">',
      '<button type="button" class="z-start-card" id="z-start-blank"><span class="z-start-icon">✦</span><strong>Trang trắng</strong><small>Tự do sáng tạo từ đầu</small></button>',
      '<button type="button" class="z-start-card" id="z-start-template"><span class="z-start-icon">▦</span><strong>Chọn mẫu</strong><small>Sửa ngay mẫu có sẵn</small></button>',
      '<button type="button" class="z-start-card" id="z-start-print"><span class="z-start-icon">▤</span><strong>Thiệp & in ấn</strong><small>Cưới hỏi, cáo phó, quảng cáo</small></button>',
      '<button type="button" class="z-start-card" id="z-start-ai"><span class="z-start-icon">✧</span><strong>Ý tưởng bằng AI</strong><small>Mở công cụ AI hiện có</small></button>',
      '</div></section>',
      '<div class="z-section-title" id="z-templates"><div><h3>Khám phá mẫu</h3>',
      '<p>Chọn mẫu và thay nội dung ngay trong xưởng thiết kế.</p></div></div>',
      '<div class="z-filters" id="z-filters" aria-label="Lọc mẫu theo danh mục">',
      '<button type="button" class="z-filter is-active" data-kind="Tất cả">Tất cả</button>',
      '<button type="button" class="z-filter" data-kind="Quảng cáo">Quảng cáo</button>',
      '<button type="button" class="z-filter" data-kind="Cưới hỏi">Cưới hỏi</button>',
      '<button type="button" class="z-filter" data-kind="In ấn">In ấn</button>',
      '<button type="button" class="z-filter" data-kind="Mạng xã hội">Mạng xã hội</button>',
      '<button type="button" class="z-filter" data-kind="Quán ăn">Quán ăn</button>',
      '</div><div class="z-gallery" id="z-gallery"></div>',
      '<p id="z-no-results" class="z-empty z-hidden">Không tìm thấy mẫu phù hợp. Thử từ khóa khác hoặc bắt đầu từ trang trắng.</p>',
      '<p class="z-privacy">Dữ liệu chỉ lưu trên thiết bị này. Hãy xuất PNG để chia sẻ; đây là xưởng thiết kế thử nghiệm.</p></div>',
      '<div id="z-editor" class="z-hidden"><div class="z-editor-shell">',
      '<div class="z-editor-heading"><button type="button" class="z-softbtn" id="z-back">← Trang chủ</button>',
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
    // Images are kept inside editable projects as compressed local data URLs.
    var imageCache=new Map();
    function imageFor(src){
      if(typeof src!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(src))return null;
      if(imageCache.has(src))return imageCache.get(src);
      var im=new Image();imageCache.set(src,im);
      im.onload=function(){draw();};
      im.onerror=function(){notice('Ảnh trong dự án bị lỗi, vui lòng thay ảnh.');};
      im.src=src;return im;
    }
    function imageSize(l){
      var ww=cv.width*Math.max(.1,Math.min(.95,Number(l.w)||.5));
      return {w:ww,h:ww/Math.max(.05,Number(l.aspect)||1)};
    }
    function imagesReady(){
      return !!doc&&doc.layers.every(function(l){
        if(l.type!=='image')return true;
        var im=imageFor(l.src);
        return !!(im&&im.complete&&im.naturalWidth>0);
      });
    }
    var imageButton=document.createElement('button');
    imageButton.type='button';imageButton.id='z-add-image';imageButton.className='z-mainbtn';
    imageButton.textContent='+ Thêm ảnh';$('z-add').after(imageButton);
    var imagePicker=document.createElement('input');
    imagePicker.type='file';imagePicker.id='z-image-upload';
    imagePicker.accept='image/jpeg,image/png,image/webp';imagePicker.style.display='none';
    imageButton.after(imagePicker);
    var textTools=$('z-text').closest('.z-control-box');
    var imageTools=document.createElement('div');
    imageTools.className='z-control-box z-hidden';imageTools.id='z-image-tools';
    imageTools.innerHTML='<h4>Ảnh đang chọn</h4><label>Chiều rộng ảnh (% khổ thiết kế)<input id="z-image-size" type="range" min="10" max="95" value="50"></label><p id="z-image-size-label" style="font-size:12px;color:#a9d9dd"></p><p style="font-size:11px;color:#97a9c4">Ảnh được giữ tỉ lệ · Chạm và kéo trên canvas</p><button type="button" class="z-smallbtn" id="z-remove-image">Xóa ảnh đã chọn</button>';
    textTools.after(imageTools);
    var jsonButton=document.createElement('button');
    jsonButton.type='button';jsonButton.id='z-importjson';jsonButton.className='z-smallbtn';
    jsonButton.textContent='Nhập dự án JSON';$('z-exportjson').after(jsonButton);
    var jsonPicker=document.createElement('input');
    jsonPicker.type='file';jsonPicker.id='z-project-upload';jsonPicker.accept='.json,application/json';
    jsonPicker.style.display='none';jsonButton.after(jsonPicker);
    function viewTab() {
      Array.prototype.forEach.call(nav.querySelectorAll('[data-tab]'), function (b) {
        b.classList.toggle('active', b === tab);
      });
      // Only switch top-level app panels; keep nested Studio home sections visible.
      Array.prototype.forEach.call(main.children, function (s) {
        if(s.tagName==='SECTION')s.classList.toggle('hidden',s!==panel);
      });
    }
    tab.addEventListener('click', viewTab);
    $('language').addEventListener('change',updateStudioLanguage);
    function blank() {
      return {version:1, name:'Thiết kế mới', width:1080, height:1350, dpi:150, bg:['#14264d','#2383a5'], layers:[]};
    }
    function fromTemplate(t) {
      var d = blank(); d.name = t.name; d.bg = [t.a,t.b];
      d.layers = t.layers.map(function (l) { var x=deep(l);x.id='z'+seq++;return x; });
      return d;
    }
    function notice(msg) { $('z-status').dataset.originalMessage=msg; $('z-status').textContent=studioText(msg); }
    function historyBefore() {
      if (!doc) return;
      dirty = true;
      undo.push(JSON.stringify(doc)); if (undo.length>30) undo.shift(); redo=[];
    }
    function select(id) { selectedId=id; controls(); draw(); }
    function controls() {
      var l = doc && doc.layers.find(function (x) {return x.id===selectedId;});
      var isPic=!!(l&&l.type==='image'),isText=!!(l&&!isPic);
      textTools.classList.toggle('z-hidden',isPic);
      imageTools.classList.toggle('z-hidden',!isPic);
      $('z-text').value=isText?l.text:'';
      $('z-font').value=isText?l.size:'';
      $('z-color').value=isText?l.color:'#ffffff';
      $('z-text').disabled=!isText;$('z-font').disabled=!isText;$('z-color').disabled=!isText;
      $('z-remove').disabled=!isText;
      if(isPic){
        $('z-image-size').value=Math.round(100*(l.w||.5));
        $('z-image-size-label').textContent=Math.round(100*(l.w||.5))+'% · '+(l.name||'Ảnh');
      }
      if(doc){ $('z-name').value=doc.name;$('z-width').value=doc.width;$('z-height').value=doc.height;$('z-dpi').value=doc.dpi; }
      $('z-undo').disabled=!undo.length;$('z-redo').disabled=!redo.length;
      var box=$('z-layers');box.replaceChildren();
      if(doc){
        doc.layers.slice().reverse().forEach(function(layer){
          var row=document.createElement('div');row.className='z-layer'+(layer.id===selectedId?' z-selected':'');
          var title=document.createElement('button');title.type='button';title.className='z-layer-title';title.textContent=layer.type==='image'?'🖼 '+(layer.name||'Ảnh'):layer.text||studioText('(Chữ trống)');
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
      if(cv.width!==doc.width)cv.width=doc.width;
      if(cv.height!==doc.height)cv.height=doc.height;
      var w=cv.width,h=cv.height;
      ctx.clearRect(0,0,w,h);
      var g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,doc.bg[0]);g.addColorStop(1,doc.bg[1]);
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      ctx.save();ctx.globalAlpha=.09;ctx.strokeStyle='#ffffff';ctx.lineWidth=w*.002;
      [0.28,0.48,0.70].forEach(function(scale){ctx.beginPath();ctx.arc(w*.95,h*.10,w*scale,0,Math.PI*2);ctx.stroke();});
      ctx.restore();
      doc.layers.forEach(function(l){
        var x=l.x*w,y=l.y*h,tw,bh;
        if(l.type==='image'){
          var sz=imageSize(l),im=imageFor(l.src);
          tw=sz.w;bh=sz.h;
          if(im&&im.complete&&im.naturalWidth>0)ctx.drawImage(im,x-tw/2,y-bh/2,tw,bh);
          else {ctx.fillStyle='#ffffff44';ctx.fillRect(x-tw/2,y-bh/2,tw,bh);}
        }else{
          ctx.font=String(l.weight||700)+' '+Math.round((l.size||60)*w/1080)+'px Arial, sans-serif';
          ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=l.color||'#ffffff';
          ctx.fillText(l.text||'',x,y,w*.9);
          tw=Math.min(ctx.measureText(l.text||'').width,w*.9);
          bh=(l.size||60)*w/1080*1.23;
        }
        if(showSelection!==false&&selectedId===l.id){
          ctx.strokeStyle='#7ff6de';ctx.lineWidth=Math.max(2,w*.003);
          ctx.setLineDash([w*.008,w*.005]);ctx.strokeRect(x-tw/2-10,y-bh/2-8,tw+20,bh+16);ctx.setLineDash([]);
        }
      });
    }
    function point(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*cv.width,y:(e.clientY-r.top)/r.height*cv.height};}
    function hit(p){
      for(var i=doc.layers.length-1;i>=0;i--){
        var l=doc.layers[i],tw,bh;
        if(l.type==='image'){var sz=imageSize(l);tw=sz.w;bh=sz.h;}
        else{
          ctx.font=String(l.weight||700)+' '+Math.round((l.size||60)*cv.width/1080)+'px Arial';
          tw=Math.min(ctx.measureText(l.text||'').width,cv.width*.9);
          bh=(l.size||60)*cv.width/1080*1.5;
        }
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
      var bx=.04,by=.04;
      if(l.type==='image'){var sz=imageSize(l);bx=Math.min(.5,sz.w/(2*cv.width));by=Math.min(.5,sz.h/(2*cv.height));}
      l.x=Math.max(bx,Math.min(1-bx,p.x/cv.width-dragging.dx));
      l.y=Math.max(by,Math.min(1-by,p.y/cv.height-dragging.dy));
      draw();e.preventDefault();
    });
    function stopDrag(){
      if(!dragging)return;
      if(JSON.stringify(doc)!==dragging.prior) {
        dirty=true;undo.push(dragging.prior); if(undo.length>30)undo.shift();redo=[];controls();
      }
      dragging=null;cv.classList.remove('z-dragging');
    }
    cv.addEventListener('pointerup',stopDrag);cv.addEventListener('pointercancel',stopDrag);
    function openEditor(d,id){
      doc=deep(d); currentId=id||'';
      // Avoid duplicate layer IDs when reopening a saved or imported project.
      doc.layers.forEach(function(l){
        var m=/^z([0-9]+)$/.exec(l.id||'');
        if(m)seq=Math.max(seq,Number(m[1])+1);
      });
      selectedId=doc.layers.length?doc.layers[doc.layers.length-1].id:'';
      undo=[];redo=[];dirty=false;
      $('z-home').classList.add('z-hidden');$('z-editor').classList.remove('z-hidden');
      viewTab();controls();draw();
      notice('Chỉnh chữ, di chuyển rồi lưu dự án. Không cần tài khoản hoặc API key.');
      window.scrollTo({top:0,behavior:'smooth'});
    }
    recordStudioUI();
    var gallery=$('z-gallery'), galleryItems=[], activeKind='Tất cả';
    function plain(s){
      return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
    }
    function refreshGallery(){
      var term=plain($('z-template-search').value), shown=0;
      galleryItems.forEach(function(entry){
        var visible=(activeKind==='Tất cả'||entry.template.kind===activeKind)&&
          (!term||plain(entry.template.name+' '+entry.template.kind+' '+entry.template.preview+' '+entry.template.sub).includes(term));
        entry.button.hidden=!visible;if(visible)shown++;
      });
      $('z-no-results').classList.toggle('z-hidden',shown>0);
    }
    function chooseCategory(kind){
      activeKind=kind;
      Array.prototype.forEach.call($('z-filters').querySelectorAll('button'),function(b){
        b.classList.toggle('is-active',b.dataset.kind===kind);
        b.setAttribute('aria-pressed',b.dataset.kind===kind?'true':'false');
      });
      refreshGallery();
    }
    $('z-template-search').addEventListener('input',refreshGallery);
    Array.prototype.forEach.call($('z-filters').querySelectorAll('button'),function(b){
      b.onclick=function(){chooseCategory(b.dataset.kind);};
    });
    templates.forEach(function(t){
      var b=document.createElement('button');b.className='z-template';b.type='button';
      b.innerHTML='<div class="z-template-preview '+t.css+'"><strong></strong><small></small></div><div class="z-template-info"><b></b><small></small></div>';
      b.querySelector('strong').textContent=t.preview;
      b.querySelector('.z-template-preview small').textContent=t.sub;
      b.querySelector('.z-template-info b').textContent=studioText(t.name);
      b.querySelector('.z-template-info small').textContent=studioText(t.kind)+' · '+studioText('Có thể chỉnh sửa');
      b.onclick=function(){openEditor(fromTemplate(t));};
      galleryItems.push({button:b,template:t});gallery.append(b);
    });
    chooseCategory('Tất cả');
    $('z-start-blank').onclick=function(){openEditor(blank());};
    $('z-start-template').onclick=function(){chooseCategory('Tất cả');$('z-templates').scrollIntoView({behavior:'smooth',block:'start'});};
    $('z-start-print').onclick=function(){
      $('z-template-search').value='';
      chooseCategory('Cưới hỏi');
      $('z-templates').scrollIntoView({behavior:'smooth',block:'start'});
    };
    $('z-start-ai').onclick=function(){$('navAi').click();};
    $('z-new').onclick=function(){openEditor(blank());};
    imageButton.onclick=function(){imagePicker.click();};
    imagePicker.addEventListener('change',function(){
      var file=this.files&&this.files[0];this.value='';
      if(!file||!doc)return;
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>8*1024*1024){
        notice('Chỉ hỗ trợ JPG, PNG, WebP dưới 8 MB.');return;
      }
      var url=URL.createObjectURL(file),im=new Image();
      im.onerror=function(){URL.revokeObjectURL(url);notice('Không đọc được ảnh.');};
      im.onload=function(){
        try{
          var scale=Math.min(1,1400/im.width,1400/im.height),c=document.createElement('canvas');
          c.width=Math.max(1,Math.round(im.width*scale));
          c.height=Math.max(1,Math.round(im.height*scale));
          c.getContext('2d').drawImage(im,0,0,c.width,c.height);
          var src=c.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.82);
          if(src.length>2800000){notice('Ảnh quá lớn để lưu cùng dự án. Chọn ảnh nhỏ hơn.');return;}
          var ratio=c.width/c.height;
          historyBefore();
          var layer={id:'z'+seq++,type:'image',name:file.name.slice(0,65),src:src,
            x:.5,y:.5,w:Math.max(.1,Math.min(.6,.60*doc.height*ratio/doc.width)),aspect:ratio};
          doc.layers.push(layer);imageFor(src);select(layer.id);
          notice('Đã thêm ảnh. Kéo ảnh trên canvas; chỉnh kích thước ở bảng điều khiển.');
        }catch(e){notice('Không xử lý được ảnh này.');}
        finally{URL.revokeObjectURL(url);}
      };
      im.src=url;
    });
    $('z-image-size').addEventListener('change',function(){
      var l=doc&&doc.layers.find(function(x){return x.id===selectedId;});
      if(!l||l.type!=='image')return;
      var w=Math.max(.1,Math.min(.95,Number(this.value)/100||.5));
      if(l.w===w)return;historyBefore();l.w=w;controls();draw();
    });
    $('z-remove-image').onclick=function(){
      if(!doc)return;
      var l=doc.layers.find(function(x){return x.id===selectedId;});
      if(!l||l.type!=='image')return;
      historyBefore();doc.layers=doc.layers.filter(function(x){return x.id!==selectedId;});
      select(doc.layers.length?doc.layers[doc.layers.length-1].id:'');
    };
    $('z-jump').onclick=function(){$('z-templates').scrollIntoView({behavior:'smooth',block:'start'});};
    $('z-back').onclick=function(){
      if(dirty&&!persistProject(true)){
        notice('Không lưu được. Hãy xuất JSON để sao lưu trước khi rời xưởng thiết kế.');
        return;
      }
      $('z-editor').classList.add('z-hidden');$('z-home').classList.remove('z-hidden');
      renderSaved();window.scrollTo({top:0,behavior:'smooth'});
    };
    $('z-add').onclick=function(){
      if(!doc)return;historyBefore();
      var l={id:'z'+seq++,text:studioText('Chữ mới'),x:.5,y:.5,size:65,color:'#ffffff',weight:700};
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
    $('z-undo').onclick=function(){if(!undo.length)return;dirty=true;redo.push(JSON.stringify(doc));doc=JSON.parse(undo.pop());controls();draw();};
    $('z-redo').onclick=function(){if(!redo.length)return;dirty=true;undo.push(JSON.stringify(doc));doc=JSON.parse(redo.pop());controls();draw();};
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
      if(!imagesReady()){notice('Ảnh chưa tải xong hoặc bị lỗi; chưa thể xuất PNG.');return;}
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
    function previewCanvas(){
      try {
        if(!imagesReady())return '';
        draw(false);
        var thumb=document.createElement('canvas');thumb.width=120;thumb.height=150;
        thumb.getContext('2d').drawImage(cv,0,0,thumb.width,thumb.height);
        return thumb.toDataURL('image/jpeg',.57);
      }catch(e){return '';}
      finally{draw();}
    }
    function persistProject(automatic){
      if(!doc)return false;
      doc.name=($('z-name').value||'Thiết kế ZUNVA').trim().slice(0,60);
      var all=readSaved();
      var id=currentId||('project-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
      all=all.filter(function(p){return p.id!==id;});
      all.unshift({id:id,saved:new Date().toISOString(),design:deep(doc),preview:previewCanvas()});
      if(!writeSaved(all)){
        notice('Không lưu được: dung lượng bộ nhớ đầy. Hãy xuất bản JSON.');
        return false;
      }
      currentId=id;dirty=false;
      if(!automatic)notice('Đã lưu! Thiết kế sẽ hiện ở mục Tiếp tục thiết kế.');
      return true;
    }
    $('z-save').onclick=function(){persistProject(false);};
    jsonButton.onclick=function(){jsonPicker.click();};
    jsonPicker.addEventListener('change',function(){
      var file=this.files&&this.files[0];this.value='';
      if(!file)return;
      if(file.size>8*1024*1024){notice('Dự án lớn hơn 8 MB, không thể nhập.');return;}
      var reader=new FileReader();
      reader.onerror=function(){notice('Không đọc được file JSON.');};
      reader.onload=function(){
        try{
          var d=JSON.parse(String(reader.result));
          if(!d||d.version!==1||!Array.isArray(d.layers)||d.layers.length>100||
            !Number.isFinite(d.width)||d.width<480||d.width>3000||
            !Number.isFinite(d.height)||d.height<480||d.height>3000||
            !Array.isArray(d.bg)||d.bg.length!==2||
            !d.bg.every(function(c){return typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c);}))
              throw Error('project');
          d.layers.forEach(function(l){
            if(!l||typeof l.id!=='string'||!Number.isFinite(l.x)||!Number.isFinite(l.y))throw Error('layer');
            if(l.type==='image'){
              if(typeof l.src!=='string'||l.src.length>2800000||
                !/^data:image\/(png|jpeg|webp);base64,/.test(l.src)||!(l.aspect>0)||!(l.w>0))
                throw Error('image');
            }else if(typeof l.text!=='string')throw Error('text');
          });
          openEditor(d);notice('Đã nhập dự án. Kiểm tra rồi bấm Lưu thiết kế.');
        }catch(e){notice('Định dạng JSON không hợp lệ cho ZUNVA.');}
      };
      reader.readAsText(file);
    });
    $('z-exportjson').onclick=function(){
      if(!doc)return;
      var blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});
      var url=URL.createObjectURL(blob);
      download(url,'zunva-project-'+Date.now()+'.json');setTimeout(function(){URL.revokeObjectURL(url);},5000);
      notice('Đã tạo bản sao JSON để lưu trữ.');
    };
    function renderSaved(){
      var node=$('z-project-list');node.replaceChildren();
      var all=readSaved();
      if(!all.length){
        var empty=document.createElement('div');empty.className='z-empty';
        empty.textContent=studioText('Chưa có bản thiết kế nào. Chọn trang trắng hoặc mẫu để bắt đầu, ZUNVA sẽ lưu lại cho lần sau.');
        node.append(empty);return;
      }
      all.forEach(function(item){
        if(!item||!item.design||!Array.isArray(item.design.layers))return;
        var row=document.createElement('div');row.className='z-project-row';
        var picture=document.createElement('div');picture.className='z-project-cover';
        if(item.preview&&/^data:image\/jpeg;base64,/.test(item.preview)){
          var im=document.createElement('img');im.src=item.preview;im.alt=studioText('Xem trước thiết kế');
          picture.append(im);
        }else picture.textContent='✦';
        var body=document.createElement('div');body.className='z-project-body';
        var title=document.createElement('strong');title.textContent=item.design.name||'Thiết kế';
        var subtitle=document.createElement('small');
        var date=new Date(item.saved);
        subtitle.textContent=studioText('Lưu: ')+(Number.isNaN(date.getTime())?studioText('Trên thiết bị'):date.toLocaleDateString($('language').value||'vi-VN'));
        var buttons=document.createElement('div');buttons.className='z-project-actions';
        var open=document.createElement('button');open.type='button';open.className='z-open';open.textContent=studioText('Tiếp tục');
        open.onclick=function(){openEditor(item.design,item.id);};
        var del=document.createElement('button');del.type='button';del.textContent=studioText('Xóa');
        del.onclick=function(){
          if(window.confirm(studioText('Xóa thiết kế này khỏi thiết bị?'))){
            writeSaved(readSaved().filter(function(p){return p.id!==item.id;}));
            renderSaved();
          }
        };
        buttons.append(open,del);body.append(title,subtitle,buttons);row.append(picture,body);node.append(row);
      });
    }
    renderSaved();viewTab();updateStudioLanguage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
