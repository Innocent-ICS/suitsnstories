import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import JSZip from "jszip";
import type { DeckInput, ImageObservationInput, UploadedDeckFile } from "./types";
import {
  detectFileThreatIndicators,
  detectPromptInjection,
  fingerprintBuffer,
  normalizeExtractedText,
  validateDeckFile,
} from "./security";

const MAX_EMBEDDED_IMAGES = 4;
const MAX_IMAGE_CANDIDATES = 12;
const MAX_VISION_IMAGE_BYTES = 850 * 1024;
const MAX_ANALYSIS_PDF_BYTES = 8 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 700;
const PDF_THUMBNAIL_PAGES = 4;
const IMAGE_LONG_EDGE = 1600;
const execFileAsync = promisify(execFile);

export async function ingestDeckFile(file: UploadedDeckFile): Promise<DeckInput> {
  const validation = validateDeckFile(file);
  if (!validation.ok) throw new Error(validation.error);

  const fingerprint = fingerprintBuffer(file.buffer);
  const structuralNotes: string[] = [];
  const preprocessingNotes: string[] = [];
  const images: ImageObservationInput[] = [];
  let extractedText = "";
  let pdfDataUrl: string | undefined;

  if (validation.kind === "pptx") {
    const extracted = await extractPresentation(file.buffer);
    extractedText = extracted.text;
    structuralNotes.push(...extracted.structuralNotes);
    preprocessingNotes.push(...extracted.preprocessingNotes);
    images.push(...extracted.images);
  } else if (validation.kind === "docx") {
    const extracted = await extractDocument(file.buffer);
    extractedText = extracted.text;
    structuralNotes.push(...extracted.structuralNotes);
    preprocessingNotes.push(...extracted.preprocessingNotes);
    images.push(...extracted.images);
  } else if (validation.kind === "pdf") {
    const preprocessed = await preprocessPdf(file.buffer, validation.safeName);
    extractedText = extractPdfTextHeuristic(preprocessed.pdfBuffer || file.buffer) || extractPdfTextHeuristic(file.buffer);
    structuralNotes.push(...preprocessed.structuralNotes);
    preprocessingNotes.push(...preprocessed.preprocessingNotes);
    images.push(...preprocessed.images);
    pdfDataUrl = preprocessed.pdfDataUrl;
  } else if (validation.kind === "image") {
    const imageNotes: string[] = [];
    const image = await buildVisionImage(
      file.buffer,
      validation.safeName,
      normalizeMimeType(file.type, validation.safeName),
      "upload",
      imageNotes
    );
    if (image) images.push(image);
    structuralNotes.push("Image uploaded directly; preprocessed vision analysis is required for text and visual extraction.");
    preprocessingNotes.push(...imageNotes);
  } else {
    extractedText = file.buffer.toString("utf8");
    preprocessingNotes.push("Plain text input normalized and truncated for analysis; no binary graphics were sent.");
  }

  const normalizedText = normalizeExtractedText(extractedText);
  const securityFlags = [
    ...detectPromptInjection(`${normalizedText}\n${structuralNotes.join("\n")}`),
    ...detectFileThreatIndicators(validation.kind, file.buffer, structuralNotes),
  ];
  const analysisBytes = estimateAnalysisBytes(normalizedText, structuralNotes, images, pdfDataUrl);

  return {
    kind: validation.kind,
    fileName: validation.safeName,
    mimeType: normalizeMimeType(file.type, validation.safeName),
    fileSize: file.size,
    fingerprint,
    extractedText: normalizedText,
    structuralNotes: [...structuralNotes, ...preprocessingNotes]
      .map((note) => normalizeExtractedText(note).slice(0, 1600)),
    securityFlags,
    images,
    preprocessing: {
      originalBytes: file.size,
      analysisBytes,
      reductionPercent: Math.max(0, Math.round((1 - analysisBytes / Math.max(file.size, 1)) * 100)),
      notes: preprocessingNotes.map((note) => normalizeExtractedText(note).slice(0, 900)),
    },
    pdfDataUrl,
  };
}

async function extractPresentation(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) throw new Error("PPTX has too many internal files to process safely.");

  const slideEntries = entries
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name))
    .sort((a, b) => slideNumber(a.name) - slideNumber(b.name));
  const notesEntries = entries.filter((entry) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(entry.name));

  const slides: string[] = [];
  const structuralNotes: string[] = [];

  for (const slide of slideEntries) {
    const xml = await slide.async("string");
    const text = extractOpenXmlText(xml);
    const slideNo = slideNumber(slide.name);
    const pictureCount = countMatches(xml, /<p:pic\b/g);
    const shapeCount = countMatches(xml, /<p:sp\b/g);
    const chartCount = countMatches(xml, /<c:chart\b|<a:tbl\b/g);
    if (text) slides.push(`Slide ${slideNo}: ${text}`);
    structuralNotes.push(
      `Slide ${slideNo}: ${shapeCount} text/shape objects, ${pictureCount} images, ${chartCount} chart or table objects.`
    );
  }

  for (const note of notesEntries) {
    const text = extractOpenXmlText(await note.async("string"));
    if (text) structuralNotes.push(`Speaker note ${slideNumber(note.name)}: ${text.slice(0, 600)}`);
  }

  const media = await extractZipImages(entries, "ppt/media/");
  return {
    text: slides.join("\n\n"),
    structuralNotes: [...structuralNotes, ...media.notes],
    preprocessingNotes: media.notes,
    images: media.images,
  };
}

async function extractDocument(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) throw new Error("DOCX has too many internal files to process safely.");

  const documentEntry = zip.file("word/document.xml");
  const text = documentEntry ? extractOpenXmlText(await documentEntry.async("string")) : "";
  const media = await extractZipImages(entries, "word/media/");

  return {
    text,
    structuralNotes: [
      `DOCX source with ${text.split(/\s+/).filter(Boolean).length} extracted words and ${media.images.length} embedded image samples.`,
      ...media.notes,
    ],
    preprocessingNotes: media.notes,
    images: media.images,
  };
}

async function extractZipImages(entries: JSZip.JSZipObject[], prefix: string) {
  const imageEntries = entries
    .filter((entry) => !entry.dir && entry.name.startsWith(prefix))
    .filter((entry) => /\.(png|jpe?g|webp)$/i.test(entry.name));

  const images: ImageObservationInput[] = [];
  const notes: string[] = [];
  let skipped = Math.max(0, imageEntries.length - MAX_IMAGE_CANDIDATES);

  for (const entry of imageEntries.slice(0, MAX_IMAGE_CANDIDATES)) {
    if (images.length >= MAX_EMBEDDED_IMAGES) {
      skipped += 1;
      continue;
    }
    const bytes = Buffer.from(await entry.async("uint8array"));
    const mimeType = normalizeMimeType("", entry.name);
    const image = await buildVisionImage(
      bytes,
      entry.name.split("/").pop() || "embedded-image",
      mimeType,
      "embedded",
      notes
    );
    if (image) images.push(image);
    else skipped += 1;
  }

  if (imageEntries.length > 0) {
    notes.push(
      `${prefix} preprocessing kept ${images.length} lightweight image sample${
        images.length === 1 ? "" : "s"
      } and omitted ${skipped} embedded graphic asset${skipped === 1 ? "" : "s"} from the model payload.`
    );
  }

  return { images, notes };
}

async function preprocessPdf(buffer: Buffer, fileName: string) {
  const preprocessingNotes: string[] = [];
  const structuralNotes: string[] = [
    "PDF uploaded. The Perceptoscope creates a compressed analysis artifact before any model/OCR request.",
    `Local PDF page estimate: ${estimatePdfPages(buffer)} pages.`,
  ];
  let pdfBuffer: Buffer | undefined;
  let pdfDataUrl: string | undefined;
  let images: ImageObservationInput[] = [];

  try {
    const compressed = await compressPdfWithGhostscript(buffer, fileName);
    pdfBuffer = compressed.pdfBuffer;
    images = compressed.images;
    preprocessingNotes.push(...compressed.notes);
  } catch (error) {
    preprocessingNotes.push(
      `PDF binary compression was unavailable (${describeToolError(error)}); relying on local text extraction and any available lightweight evidence.`
    );
  }

  const candidate = pdfBuffer && pdfBuffer.byteLength < buffer.byteLength ? pdfBuffer : buffer;
  if (candidate.byteLength <= MAX_ANALYSIS_PDF_BYTES) {
    pdfDataUrl = toDataUrl(candidate, "application/pdf");
    preprocessingNotes.push(
      `PDF analysis artifact selected at ${formatBytes(candidate.byteLength)} for OCR/parser use.`
    );
  } else {
    preprocessingNotes.push(
      `PDF analysis artifact is ${formatBytes(candidate.byteLength)}, above the ${formatBytes(
        MAX_ANALYSIS_PDF_BYTES
      )} model payload cap; raw PDF bytes were omitted and low-resolution page samples/text were used instead.`
    );
  }

  return {
    pdfBuffer: candidate,
    pdfDataUrl,
    images,
    structuralNotes,
    preprocessingNotes,
  };
}

async function compressPdfWithGhostscript(buffer: Buffer, fileName: string) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "perceptoscope-pdf-"));
  const inputPath = path.join(tempDir, fileName.endsWith(".pdf") ? fileName : "input.pdf");
  const outputPath = path.join(tempDir, "analysis.pdf");
  const thumbnailPattern = path.join(tempDir, "page-%03d.jpg");

  try {
    await writeFile(inputPath, buffer);
    await runFirstAvailable(["gs", "/usr/local/bin/gs", "/opt/homebrew/bin/gs"], [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/screen",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-dDetectDuplicateImages=true",
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-dDownsampleColorImages=true",
      "-dColorImageResolution=96",
      "-dDownsampleGrayImages=true",
      "-dGrayImageResolution=96",
      "-dDownsampleMonoImages=true",
      "-dMonoImageResolution=150",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ]);

    await runFirstAvailable(["gs", "/usr/local/bin/gs", "/opt/homebrew/bin/gs"], [
      "-sDEVICE=jpeg",
      "-dJPEGQ=58",
      "-r72",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-dFirstPage=1",
      `-dLastPage=${PDF_THUMBNAIL_PAGES}`,
      `-sOutputFile=${thumbnailPattern}`,
      inputPath,
    ]);

    const [pdfBuffer, files] = await Promise.all([readFile(outputPath), readdir(tempDir)]);
    const pageImages = files
      .filter((name) => /^page-\d+\.jpg$/.test(name))
      .sort()
      .slice(0, PDF_THUMBNAIL_PAGES);

    const images: ImageObservationInput[] = [];
    for (const imageName of pageImages) {
      const imageBuffer = await readFile(path.join(tempDir, imageName));
      if (imageBuffer.byteLength <= MAX_VISION_IMAGE_BYTES) {
        images.push({
          filename: imageName,
          mimeType: "image/jpeg",
          dataUrl: toDataUrl(imageBuffer, "image/jpeg"),
          source: "preprocessed",
        });
      }
    }

    const reductionPercent = Math.max(0, Math.round((1 - pdfBuffer.byteLength / buffer.byteLength) * 100));
    return {
      pdfBuffer,
      images,
      notes: [
        `Ghostscript compressed the PDF from ${formatBytes(buffer.byteLength)} to ${formatBytes(
          pdfBuffer.byteLength
        )} (${reductionPercent}% smaller).`,
        `Rendered ${images.length} low-resolution page thumbnail${
          images.length === 1 ? "" : "s"
        } for visual diagnosis while avoiding full-resolution graphics.`,
      ],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function buildVisionImage(
  bytes: Buffer,
  filename: string,
  mimeType: string,
  source: ImageObservationInput["source"],
  notes: string[]
) {
  let payload = bytes;
  let outputMimeType = mimeType;
  let outputName = filename;

  if (bytes.byteLength > MAX_VISION_IMAGE_BYTES || mimeType !== "image/jpeg") {
    try {
      const compressed = await compressImageWithSips(bytes, filename);
      if (compressed.buffer.byteLength < payload.byteLength) {
        payload = compressed.buffer;
        outputMimeType = "image/jpeg";
        outputName = compressed.filename;
        notes.push(
          `Compressed ${filename} from ${formatBytes(bytes.byteLength)} to ${formatBytes(payload.byteLength)} for vision analysis.`
        );
      }
    } catch (error) {
      notes.push(`Could not compress ${filename} (${describeToolError(error)}).`);
    }
  }

  if (payload.byteLength > MAX_VISION_IMAGE_BYTES) {
    notes.push(
      `Skipped ${filename} because its optimized size (${formatBytes(payload.byteLength)}) is above the ${formatBytes(
        MAX_VISION_IMAGE_BYTES
      )} image payload cap.`
    );
    return null;
  }

  return {
    filename: outputName,
    mimeType: outputMimeType,
    dataUrl: toDataUrl(payload, outputMimeType),
    source,
  };
}

async function compressImageWithSips(buffer: Buffer, fileName: string) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "perceptoscope-image-"));
  const extension = fileName.split(".").pop()?.replace(/[^\w]/g, "") || "img";
  const inputPath = path.join(tempDir, `input.${extension}`);
  const outputPath = path.join(tempDir, "analysis.jpg");

  try {
    await writeFile(inputPath, buffer);
    await runFirstAvailable(["sips", "/usr/bin/sips"], [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "58",
      "-Z",
      String(IMAGE_LONG_EDGE),
      inputPath,
      "--out",
      outputPath,
    ]);

    return {
      filename: `${fileName.replace(/\.[^.]+$/, "") || "image"}-analysis.jpg`,
      buffer: await readFile(outputPath),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function extractOpenXmlText(xml: string) {
  const textNodes = [
    ...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g),
    ...xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g),
  ];
  return textNodes
    .map((match) => decodeXmlEntities(match[1] || ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPdfTextHeuristic(buffer: Buffer) {
  const raw = buffer.toString("latin1");
  const textObjects = [...raw.matchAll(/\((?:\\.|[^\\)]){2,}\)\s*T[Jj]/g)]
    .slice(0, 1200)
    .map((match) => match[0].replace(/\)\s*T[Jj]$/, "").slice(1))
    .map(decodePdfString);
  return normalizeExtractedText(textObjects.join(" "));
}

function decodePdfString(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, escaped: string) => {
      const replacements: Record<string, string> = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        "(": "(",
        ")": ")",
        "\\": "\\",
      };
      return replacements[escaped] || escaped;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) => String.fromCharCode(parseInt(octal, 8)));
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function normalizeMimeType(mimeType: string, fileName: string) {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "pdf") return "application/pdf";
  if (extension === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "text/plain";
}

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function slideNumber(name: string) {
  return Number(name.match(/(\d+)\.xml$/)?.[1] || 0);
}

function countMatches(value: string, pattern: RegExp) {
  return (value.match(pattern) || []).length;
}

async function runFirstAvailable(candidates: string[], args: string[]) {
  let lastError: unknown;
  for (const command of candidates) {
    try {
      await execFileAsync(command, args, {
        timeout: 45000,
        maxBuffer: 12 * 1024 * 1024,
      });
      return;
    } catch (error) {
      lastError = error;
      if (isMissingExecutable(error)) continue;
      throw error;
    }
  }
  throw lastError || new Error(`Missing executable: ${candidates.join(", ")}`);
}

function estimateAnalysisBytes(
  extractedText: string,
  structuralNotes: string[],
  images: ImageObservationInput[],
  pdfDataUrl?: string
) {
  const textBytes = Buffer.byteLength(extractedText, "utf8");
  const noteBytes = Buffer.byteLength(structuralNotes.join("\n"), "utf8");
  const imageBytes = images.reduce((sum, image) => sum + Buffer.byteLength(image.dataUrl, "utf8"), 0);
  const pdfBytes = pdfDataUrl ? Buffer.byteLength(pdfDataUrl, "utf8") : 0;
  return textBytes + noteBytes + imageBytes + pdfBytes;
}

function estimatePdfPages(buffer: Buffer) {
  const sample = buffer.toString("latin1");
  const pageMatches = sample.match(/\/Type\s*\/Page\b/g);
  return pageMatches?.length || 1;
}

function describeToolError(error: unknown) {
  if (error instanceof Error) {
    return error.message.split("\n")[0].slice(0, 180);
  }
  return "unknown preprocessing error";
}

function isMissingExecutable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
