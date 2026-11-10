AI Creator Studio v1.5 (Beta)

Free, Open-Source AI Creative Toolkit

AI Creator Studio is a browser-based creative toolkit for AI prompts, advertising design, video storyboards, image editing, and professional printing workflows.

✨ Features

- Prompt Studio — Generate multilingual image prompts.
- Video Storyboard — Plan video scenes and creative concepts.
- Image Toolkit — Edit images and export PNG, JPEG, or WebP files.
- Print Studio Pro — Calculate print dimensions, pixels, and DPI.
- AI Pro — Generate AI content using your own Google Gemini API key.
- Multi-AI Support — Work with different AI providers and copy prompts between services.
- 7 Creative Presets — Advertising signs, wedding invitations, funeral notices, product advertising, social media, video storyboards, and portrait restoration.
- Local Prompt Library — Save, reopen, and delete up to 30 prompts in your browser.
- TXT Export — Download your ideas and results as text files.

🚀 Getting Started

1. Open AI Creator Studio in your browser.
2. Choose a creative tool.
3. Enter your idea or select a preset.
4. Generate, edit, save, or export your content.

Some AI features require your own API key. Never publish API keys in your repository.

📦 Installation

Download or clone this repository:

git clone https://github.com/cuongct87/ai-creator-studio.git

Open "index.html" in a browser or deploy the project using GitHub Pages.

🧪 Kiểm thử nhanh bản web (không cần API key)

Mục này dành cho việc kiểm tra thủ công bản web tĩnh. Không cần cài đặt hay build.

Cách mở:

1. Tải hoặc clone repo, sau đó mở tệp `index.html` bằng trình duyệt (nhấp đúp hoặc kéo thả vào cửa sổ trình duyệt).
2. Không cần máy chủ; các thao tác dưới đây chạy hoàn toàn trên trình duyệt.

Checklist thủ công (3 bước):

1. **Vào Prompt Studio:** mở tab "Prompt Studio" (tab mặc định), nhập chủ đề/sản phẩm rồi bấm "Generate prompt". Prompt được tạo theo mẫu có sẵn trên máy.
2. **Tạo storyboard mẫu:** mở tab "Video Storyboard", nhập ý tưởng câu chuyện rồi bấm "Build storyboard". Đây là công cụ lập kế hoạch theo mẫu, không phải AI tạo video. Có thể bấm "Copy storyboard" để sao chép kết quả.
3. **Lưu/xuất dữ liệu không cần API:** mở tab "AI Pro", chọn nhà cung cấp "Free — offline prompt templates", nhập ý tưởng và tạo prompt theo mẫu. Sau đó dùng "Lưu ý tưởng / kết quả" để lưu vào Kho prompt trên trình duyệt (tối đa 30 mục) hoặc "Tải TXT" để tải tệp văn bản. Tệp và bản lưu không chứa API key.

Lưu ý:

- Chức năng AI thực sự (ví dụ Gemini trong tab "AI Pro", tạo ảnh bằng AI) có thể cần API key riêng của bạn. Không đăng API key lên repo, issue hoặc PR.
- Checklist trên chỉ là hướng dẫn kiểm tra thủ công dựa trên mã nguồn hiện tại, chưa phải bộ kiểm thử tự động.

🔒 Privacy

Saved prompts are stored locally in your browser. They are not automatically synchronized to the cloud.

⚠️ Limitations

- AI generation depends on the selected provider and its API availability.
- Image processing performance depends on device memory and browser capabilities.
- The toolkit does not provide its own hosted AI image or video generation backend.

📄 License

MIT License.

Free to use, modify, and distribute under the terms of the MIT License.

---

AI Creator Studio — Create smarter. Design faster.
