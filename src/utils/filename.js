import { yymmddFromDate, todayIso } from "./date.js";

export function slug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeMemoryId(dateCode) {
  return `${dateCode || yymmddFromDate(todayIso())}_${String(Date.now()).slice(-6)}`;
}

export function safeFileBase(memory) {
  return `${memory.date_code || "260509"}_${slug(memory.title || memory.event_type || "ky-niem")}`;
}

export function suggestedFileNames(dateCode, titleOrEvent, files = []) {
  const safeDateCode = String(dateCode || "260509").trim();
  const eventSlug = fileNamingSlug(titleOrEvent || "ky-niem");
  const sourceFiles = Array.from(files || []);
  const suggestions = sourceFiles.length
    ? sourceFiles.map(fileSuggestion)
    : [
        { type: "IMG", extension: "jpg" },
        { type: "VID", extension: "mp4" },
        { type: "PDF", extension: "pdf" },
        { type: "AUD", extension: "mp3" },
      ];
  const sequences = new Map();
  return suggestions.map(({ type, extension }) => {
    const sequence = (sequences.get(type) || 0) + 1;
    sequences.set(type, sequence);
    return `${safeDateCode}_${type}_${eventSlug}_${String(sequence).padStart(4, "0")}.${extension}`;
  });
}

export function fileNamingSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "KY-NIEM";
}

function fileSuggestion(file) {
  const extension = originalExtension(file?.name) || extensionFromMime(file?.type);
  return {
    type: fileType(file?.type, extension),
    extension: extension || "jpg",
  };
}

function originalExtension(name) {
  const match = String(name || "").trim().match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function extensionFromMime(mimeType) {
  const mime = String(mimeType || "").toLowerCase();
  const known = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "application/pdf": "pdf",
  };
  return known[mime] || "";
}

function fileType(mimeType, extension) {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.startsWith("video/")) return "VID";
  if (mime.startsWith("audio/")) return "AUD";
  if (mime === "application/pdf" || extension === "pdf") return "PDF";
  return "IMG";
}
