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

export function suggestedFileNames(dateCode, titleOrEvent) {
  const safeDateCode = String(dateCode || "260509").trim();
  const eventSlug = slug(titleOrEvent || "ky-niem");
  return [
    `${safeDateCode}_${eventSlug}_001.jpg`,
    `${safeDateCode}_${eventSlug}_youtube.txt`,
    `${safeDateCode}_${eventSlug}_ghichu.txt`,
    `${safeDateCode}_${eventSlug}_backup.json`,
  ];
}
