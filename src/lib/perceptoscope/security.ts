import { createHash } from "node:crypto";
import type { DeckFileKind, UploadedDeckFile } from "./types";

const MAX_FILE_SIZE = 60 * 1024 * 1024;
const MAX_TEXT_CHARS = 70000;

const FILE_SIGNATURES: Record<DeckFileKind, readonly string[]> = {
  pdf: ["25504446"],
  pptx: ["504b0304", "504b0506", "504b0708"],
  docx: ["504b0304", "504b0506", "504b0708"],
  image: ["89504e47", "ffd8ff", "52494646"],
  text: [],
};

const ALLOWED_MIME_TYPES: Record<string, DeckFileKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "text/plain": "text",
  "text/markdown": "text",
};

const EXTENSION_KINDS: Record<string, DeckFileKind> = {
  pdf: "pdf",
  pptx: "pptx",
  docx: "docx",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  txt: "text",
  md: "text",
};

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /system prompt/i,
  /developer message/i,
  /reveal.*(secret|key|token|prompt)/i,
  /exfiltrat/i,
  /act as (an|a) unrestricted/i,
  /jailbreak/i,
];

const SENSITIVE_DATA_PATTERNS = [
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*[A-Za-z0-9_\-.]{12,}/i,
  /sk-[A-Za-z0-9]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |PRIVATE )?KEY-----/,
  /\b(?:\d[ -]*?){13,19}\b/,
];

const PDF_ACTIVE_CONTENT_PATTERNS = [
  { pattern: /\/JavaScript\b|\/JS\b/i, label: "PDF active script marker" },
  { pattern: /\/OpenAction\b|\/AA\b/i, label: "PDF automatic action marker" },
  { pattern: /\/Launch\b|\/SubmitForm\b/i, label: "PDF external action marker" },
  { pattern: /\/EmbeddedFile\b|\/Filespec\b/i, label: "PDF embedded file marker" },
  { pattern: /\/RichMedia\b|\/XFA\b|\/AcroForm\b/i, label: "PDF interactive content marker" },
  { pattern: /\/URI\b/i, label: "PDF external link marker" },
];

const OFFICE_ACTIVE_CONTENT_PATTERNS = [
  { pattern: /vbaProject\.bin/i, label: "Office macro project" },
  { pattern: /activeX/i, label: "Office ActiveX control" },
  { pattern: /externalLink/i, label: "Office external workbook or document link" },
  { pattern: /oleObject/i, label: "Office embedded OLE object" },
  { pattern: /customXml/i, label: "Office custom XML payload" },
];

export function sanitizeFileName(name: string) {
  const cleaned = name
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 120) || "pitch-deck";
}

export function detectDeckKind(file: Pick<UploadedDeckFile, "name" | "type" | "buffer">): DeckFileKind | null {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const byExtension = EXTENSION_KINDS[extension];
  const byMime = ALLOWED_MIME_TYPES[file.type];
  const kind = byMime || byExtension || null;

  if (!kind) return null;
  if (kind === "text") return kind;

  const header = file.buffer.subarray(0, 4).toString("hex");
  const signatures = FILE_SIGNATURES[kind];
  if (signatures.length > 0 && !signatures.some((sig) => header.startsWith(sig))) {
    return null;
  }

  return kind;
}

export function validateDeckFile(file: UploadedDeckFile) {
  const safeName = sanitizeFileName(file.name);
  const kind = detectDeckKind({ ...file, name: safeName });

  if (!kind) {
    return {
      ok: false as const,
      error: "Unsupported file. Upload a PDF, PPTX, DOCX, PNG, JPG, WebP, TXT, or Markdown file.",
    };
  }

  if (file.size <= 0) {
    return { ok: false as const, error: "The uploaded file is empty." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false as const, error: "File too large. The Perceptoscope accepts files up to 60MB." };
  }

  return { ok: true as const, kind, safeName };
}

export function fingerprintBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

export function detectPromptInjection(text: string) {
  const flags = new Set<string>();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) flags.add("Possible prompt-injection language found in deck content.");
  }
  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    if (pattern.test(text)) flags.add("Possible secret, credential, or payment-card-like data found in deck text.");
  }
  if (/https?:\/\/\S+/i.test(text)) {
    flags.add("External links were found. The agent does not fetch deck-provided URLs.");
  }
  return Array.from(flags);
}

export function detectFileThreatIndicators(kind: DeckFileKind, buffer: Buffer, internalNames: string[] = []) {
  const flags = new Set<string>();
  const latinSample = buffer.subarray(0, Math.min(buffer.byteLength, 2_500_000)).toString("latin1");

  if (kind === "pdf") {
    for (const { pattern, label } of PDF_ACTIVE_CONTENT_PATTERNS) {
      if (pattern.test(latinSample)) flags.add(label);
    }
  }

  if (kind === "pptx" || kind === "docx") {
    for (const name of internalNames) {
      for (const { pattern, label } of OFFICE_ACTIVE_CONTENT_PATTERNS) {
        if (pattern.test(name)) flags.add(label);
      }
      if (/^https?:\/\//i.test(name)) flags.add("Office external URL reference");
    }
  }

  if (buffer.byteLength > 25 * 1024 * 1024) {
    flags.add("Large-file processing path used");
  }

  return Array.from(flags);
}

export function safeJsonText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return normalizeExtractedText(value).slice(0, 6000);
}
