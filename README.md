# AI Creator Studio v1.2 (beta)

Free, open-source browser toolkit: multilingual image prompts, template storyboards, image editor and print sizing.

## New in v1.2
- **Print Studio (Pro):** calculate print size from pixels/DPI; enter centimeters and target DPI to calculate output pixel dimensions; assess pixel count and print-use guidance. This is resampling, **not AI upscaling**. PNG, JPEG and WebP; adjustable JPEG/WebP quality. PNG export does **not** embed DPI metadata.
- **AI Pro (beta):** connect your own Google Gemini API key to generate **real AI-written text prompts and coherent text storyboards**. It does **not** generate image or video files, and it does **not** offer AI upscaling yet.
- Key stays in the browser page memory; API request is sent directly to Google. No key persistence, proxy, or server. **Browser BYOK is not suitable for high-value unrestricted secrets**; set key restrictions/quotas and use trusted devices. Provider billing/availability may apply.
- Existing free tools still work without a key.

## Deploy
Upload `index.html`, `style.css`, `script.js`, `README.md` to the repository root on GitHub Pages; keep LICENSE. Wait for deployment and refresh.

## Limits
The editor caps output at 40 megapixels and 10,000 pixels per side; available RAM and browser canvas limits may be lower. This version does not include an AI image/video rendering backend.
