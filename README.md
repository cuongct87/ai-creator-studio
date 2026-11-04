# AI Creator Studio

A free, open-source, mobile-friendly toolkit for creators. **Live demo:** https://cuongct87.github.io/ai-creator-studio/ (available after GitHub Pages is enabled).

## Working features
- **Prompt Studio:** Build structured image-generation briefs, with an output-language instruction. This is **template generation**, not a call to an AI model or an automatic translation engine.
- **Video Storyboard:** Generate a scene-by-scene planning template with image prompts, motion prompts and voiceover ideas. **No AI video is generated.** Story beats are generic planning suggestions, not AI-written narratives.
- **Image Toolkit:** Load an image locally, resize, overlay text (including Unicode), and download PNG/JPEG/WebP. Browser canvas handles export. No server upload.
- **10 UI languages:** English, Vietnamese, Simplified Chinese, Korean, Spanish, Japanese, Thai, Indonesian, French, Brazilian Portuguese. Community translation improvements are welcome.

## Run locally
Open `index.html` in a modern browser. For deployment, upload `index.html`, `style.css`, and `script.js` to the repository root, then enable **Settings → Pages → Deploy from a branch → main → /(root)**.

## Privacy
Images are handled locally in the browser; this static site has no backend, analytics, or AI API. Do not paste private data into third-party AI services without reviewing their policies.

## Contributing
Open an issue to suggest features, translations or bug reports. Pull requests are welcome. Keep changes lightweight and accessible. This project is licensed under MIT (see `LICENSE`).


## v1.1 updates
- Real template-based prompt output in 10 languages (category/style values may remain English).
- Basic / Pro image controls with print-size calculator (DPI is informational; exported files do not embed DPI metadata).
- Increased image canvas safety cap to 40 million pixels; large images may fail on low-memory devices.
- Storyboard is a template planner, **not** AI narrative understanding.
- AI upscale and Claude/OpenAI/Gemini API integrations are **not yet implemented**.


## v1.1.1
- Cache-busting script and stylesheet references to prevent old JavaScript from persisting after GitHub Pages deployments.
- Image selection no longer automatically creates a full-resolution canvas; processing begins when Apply edits is pressed.
- Pro DPI displays calculated print dimensions in cm. DPI is not embedded in exported image metadata.
- The 40-megapixel output guard remains; actual support depends on browser memory and canvas limits. This is not AI upscaling.
