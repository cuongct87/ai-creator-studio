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
