// Local-only Gemini connector for ZUNVA AI Council.
// Never store keys in the repository or print them in error messages.
const MAX_TIMEOUT_MS = 45000;
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export async function generateWithGemini(prompt, options = {}) {
  const key = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("GEMINI_API_KEY is not set. Select a Free Tier project and configure a secret locally.");
  }
  const model = options.model ?? process.env.ZUNVA_GEMINI_MODEL ?? DEFAULT_MODEL;
  if (typeof model !== "string" || !/^[\w.-]{2,80}$/.test(model)) {
    throw new Error("Invalid Gemini model identifier");
  }
  const fetcher = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== "function") throw new Error("fetch unavailable: requires Node.js 20+");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) + ":generateContent";
  const response = await fetcher(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    redirect: "error",
    signal: AbortSignal.timeout(options.timeoutMs ?? MAX_TIMEOUT_MS),
    body: JSON.stringify({
      contents: [{role: "user", parts: [{text: String(prompt)}]}],
      generationConfig: {temperature: 0.25, maxOutputTokens: 1000}
    })
  });
  // Do not echo API server response: it may include input or secrets.
  if (!response.ok) throw new Error("Gemini request failed (HTTP " + response.status + "). Check Free Tier model/limits.");
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const reply = Array.isArray(parts)
    ? parts.filter(x => typeof x?.text === "string").map(x=>x.text).join("\n").trim()
    : "";
  if (!reply) throw new Error("Gemini response contained no text");
  return reply.slice(0, 30000);
}
