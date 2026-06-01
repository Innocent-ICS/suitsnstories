export type VideoEmbedSource = {
  type: "iframe" | "video";
  src: string;
};

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function getEmbeddableVideo(rawUrl: string): VideoEmbedSource {
  const normalized = normalizeVideoUrlInput(rawUrl);
  const rawYouTubeId = normalized.match(YOUTUBE_ID_PATTERN)?.[0];

  if (rawYouTubeId) {
    return { type: "iframe", src: getYouTubeEmbedSrc(rawYouTubeId) };
  }

  const parsed = parseHttpUrl(normalized);
  if (!parsed) {
    return { type: "video", src: normalized };
  }

  const host = normalizeHost(parsed.hostname);
  const pathParts = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = cleanYouTubeId(pathParts[0]);
    if (id) return { type: "iframe", src: getYouTubeEmbedSrc(id) };
  }

  if (isYouTubeHost(host)) {
    const id =
      cleanYouTubeId(parsed.searchParams.get("v")) ||
      cleanYouTubeId(["embed", "shorts", "live", "v"].includes(pathParts[0]) ? pathParts[1] : null);

    if (id) return { type: "iframe", src: getYouTubeEmbedSrc(id) };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = host === "player.vimeo.com" ? pathParts[1] : pathParts[0];
    if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }

  return { type: "video", src: parsed.toString() };
}

export function normalizeVideoUrlInput(rawUrl: string | null | undefined): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return "";
  if (trimmed.match(YOUTUBE_ID_PATTERN)) return trimmed;

  const parsed = parseHttpUrl(trimmed);
  return parsed ? parsed.toString() : trimmed;
}

export function isValidVideoInput(rawUrl: string | null | undefined): boolean {
  const normalized = normalizeVideoUrlInput(rawUrl);
  if (!normalized) return true;
  if (normalized.match(YOUTUBE_ID_PATTERN)) return true;

  const parsed = parseHttpUrl(normalized);
  if (!parsed || !["http:", "https:"].includes(parsed.protocol)) return false;

  return parsed.hostname === "localhost" || parsed.hostname.includes(".");
}

function parseHttpUrl(rawUrl: string) {
  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(rawUrl);
    return new URL(hasProtocol ? rawUrl : `https://${rawUrl}`);
  } catch {
    return null;
  }
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
}

function isYouTubeHost(host: string) {
  return (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com")
  );
}

function cleanYouTubeId(value: string | null | undefined) {
  const match = value?.match(/[a-zA-Z0-9_-]{11}/);
  return match?.[0] || null;
}

function getYouTubeEmbedSrc(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}
