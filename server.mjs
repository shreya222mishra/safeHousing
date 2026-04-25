import http from "node:http";
import { readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnvIfPresent() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnvIfPresent();

const PORT = Number(process.env.PORT || 8000);
const AI_PROVIDER = (process.env.AI_PROVIDER || "").toLowerCase(); // "openai" | "openrouter" | ""

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_HTTP_REFERER = process.env.OPENROUTER_HTTP_REFERER || "";
const OPENROUTER_X_TITLE = process.env.OPENROUTER_X_TITLE || "HomeReady Vision";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function readBodyJson(req, maxBytes = 7_000_000) {
  return await new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf-8");
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function safePathFromUrl(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const joined = path.join(__dirname, clean);
  if (!joined.startsWith(__dirname)) return null;
  return joined;
}

function scanSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      findings: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            bucket: { type: "string", enum: ["repair", "baby", "essentials", "neuro"] },
            title: { type: "string" },
            category: { type: "string" },
            severity: { type: "string", enum: ["urgent", "warning", "info"] },
            description: { type: "string" },
            recommendation: { type: "string" },
            box: {
              type: "object",
              additionalProperties: false,
              properties: {
                x: { type: "number", minimum: 0, maximum: 100 },
                y: { type: "number", minimum: 0, maximum: 100 },
              },
              required: ["x", "y"],
            },
          },
          required: [
            "bucket",
            "title",
            "category",
            "severity",
            "description",
            "recommendation",
            "box",
          ],
        },
      },
      clearSpace: {
        type: "object",
        additionalProperties: false,
        properties: {
          focusZoneScore: { type: "number", minimum: 1, maximum: 10 },
          sensoryAudit: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
          profileFit: {
            type: "array",
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                profile: {
                  type: "string",
                  enum: [
                    "ADHD",
                    "Autism",
                    "Dyslexia",
                    "Sensory Processing",
                  ],
                },
                score: { type: "number", minimum: 1, maximum: 10 },
                rationale: { type: "string" },
              },
              required: ["profile", "score", "rationale"],
            },
          },
          bodyDoublingPrompt: { type: "string" },
        },
        required: ["focusZoneScore", "sensoryAudit", "profileFit", "bodyDoublingPrompt"],
      },
      notes: { type: "string" },
    },
    required: ["findings", "clearSpace", "notes"],
  };
}

function buildPrompt({ room, goal }) {
  const goalGuidance =
    goal === "move-in"
      ? "Focus on move-in repairs plus missing essentials that make the room usable."
      : goal === "baby"
        ? "Focus only on baby-proofing / child-safety hazards."
        : goal === "essentials"
          ? "Focus only on missing essentials and comfort items."
          : goal === "neuro"
            ? "Focus on Neurodivergent Friendly: study setup improvements (sensory load, clutter, distractions, lighting, readability)."
            : "Do a full review across repairs, baby-proofing, essentials, and neurodivergent-friendly setup.";

  return [
    "You are a move-in inspection assistant and a neurodivergent-friendly study setup coach.",
    "Analyze the provided room photo and identify visible or strongly suggested issues.",
    "",
    "Rules:",
    "- Do not claim certainty about hidden damage, mold, or leaks; use language like 'possible' or 'suggests'.",
    "- Only include findings that are supported by what you can see.",
    "- Provide 2 to 8 findings maximum.",
    "- For each finding, set:",
    "  - bucket: 'repair' | 'baby' | 'essentials' | 'neuro'",
    "  - severity: urgent | warning | info",
    "  - category: short label (e.g., 'Leakage', 'Mold', 'Outlet', 'Furniture')",
    "  - box: x/y as the approximate percent position (0-100) of where the issue is in the image.",
    "- If the issue location is unclear, use x=50, y=50.",
    "- For neuro/ClearSpace: avoid medical claims; keep it as environment and routine suggestions.",
    "",
    "ClearSpace output:",
    "- Always return clearSpace.focusZoneScore (1-10).",
    "- Always return clearSpace.sensoryAudit as a short list of visible overstimulation sources (clutter, harsh lighting, busy background, etc.).",
    "- Always return clearSpace.profileFit as 4 items (ADHD, Autism, Dyslexia, Sensory Processing) with score (1-10) and a 1-sentence rationale tied to visible environment features.",
    "- Always return clearSpace.bodyDoublingPrompt as a short optional check-in to start working (e.g., 15 minutes + quick check).",
    "",
    `Room type selected by user: ${room || "Unknown"}`,
    `Scan goal selected by user: ${goal || "Unknown"}`,
    goalGuidance,
    "",
    "Return JSON that matches the schema exactly.",
  ].join("\n");
}

async function callOpenAI({ imageDataUrl, room, goal }) {
  const prompt = buildPrompt({ room, goal });

  const body = {
    model: OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageDataUrl },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "home_ready_scan",
        strict: true,
        schema: scanSchema(),
      },
    },
    max_output_tokens: 900,
  };

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg =
      (json && (json.error?.message || json.error?.toString?.())) ||
      `OpenAI error (${resp.status})`;
    throw new Error(msg);
  }

  if (!json || typeof json.output_text !== "string") {
    throw new Error("Unexpected OpenAI response shape");
  }

  let parsed;
  try {
    parsed = JSON.parse(json.output_text);
  } catch {
    throw new Error("Model output was not valid JSON");
  }
  return parsed;
}

async function callOpenRouter({ imageDataUrl, room, goal }) {
  const prompt = buildPrompt({ room, goal });

  const body = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "home_ready_scan",
        strict: true,
        schema: scanSchema(),
      },
    },
    max_tokens: 900,
  };

  const headers = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (OPENROUTER_HTTP_REFERER) headers["HTTP-Referer"] = OPENROUTER_HTTP_REFERER;
  if (OPENROUTER_X_TITLE) headers["X-Title"] = OPENROUTER_X_TITLE;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg =
      (json && (json.error?.message || json.error?.toString?.())) ||
      `OpenRouter error (${resp.status})`;
    throw new Error(msg);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected OpenRouter response shape");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Model output was not valid JSON");
  }
  return parsed;
}

async function callGeminiRepairShops({ prompt }) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    },
  );

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg =
      json?.error?.message ||
      json?.error?.toString?.() ||
      `Gemini error (${resp.status})`;
    throw new Error(msg);
  }

  if (!json || !Array.isArray(json.candidates)) {
    throw new Error("Unexpected Gemini response shape");
  }

  return json;
}

function pickProvider() {
  if (AI_PROVIDER === "openai") return "openai";
  if (AI_PROVIDER === "openrouter") return "openrouter";
  if (OPENROUTER_API_KEY) return "openrouter";
  return "openai";
}

function hasProviderKey(provider) {
  return provider === "openrouter" ? Boolean(OPENROUTER_API_KEY) : Boolean(OPENAI_API_KEY);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url && req.url.startsWith("/api/scan")) {
      const provider = pickProvider();
      if (!hasProviderKey(provider)) {
        sendJson(res, 501, {
          error:
            provider === "openrouter"
              ? "OPENROUTER_API_KEY is not set on the server. Set it and restart to enable AI scanning."
              : "OPENAI_API_KEY is not set on the server. Set it and restart to enable AI scanning.",
        });
        return;
      }

      const body = await readBodyJson(req);
      const { imageDataUrl, room, goal } = body || {};
      if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
        sendJson(res, 400, { error: "Missing or invalid imageDataUrl" });
        return;
      }

      const result =
        provider === "openrouter"
          ? await callOpenRouter({ imageDataUrl, room, goal })
          : await callOpenAI({ imageDataUrl, room, goal });
      sendJson(res, 200, { ok: true, result });
      return;
    }

    if (req.method === "POST" && req.url && req.url.startsWith("/api/repair-shops")) {
      if (!GEMINI_API_KEY) {
        sendJson(res, 501, {
          error: "GEMINI_API_KEY is not set on the server. Set it and restart to enable repair-shop lookup.",
        });
        return;
      }

      const body = await readBodyJson(req);
      const { prompt } = body || {};
      if (typeof prompt !== "string" || !prompt.trim()) {
        sendJson(res, 400, { error: "Missing prompt" });
        return;
      }

      const result = await callGeminiRepairShops({ prompt });
      sendJson(res, 200, result);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method not allowed");
      return;
    }

    const filePath = req.url ? safePathFromUrl(req.url) : null;
    if (!filePath) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bad request");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    const file = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": file.length,
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (req.url && req.url.startsWith("/api/")) {
      sendJson(res, 500, { error: msg });
      return;
    }
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(msg);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`HomeReady Vision running on http://127.0.0.1:${PORT}`);
});
