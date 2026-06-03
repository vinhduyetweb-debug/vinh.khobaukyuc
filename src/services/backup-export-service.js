import { AGE_STAGES, DEFAULT_AGE_STAGE } from "../constants/age-stages.js";
import { EVENT_TYPES } from "../constants/event-types.js";
import { FOLDER_STRUCTURE, ROOT_FOLDER } from "../constants/app.js";
import { DEFAULT_CHILD_PROFILE, SCHEMA_VERSION } from "../constants/schema.js";
import { yymmddFromDate, todayIso } from "../utils/date.js";
import { downloadBlob } from "../utils/dom.js";
import { safeFileBase } from "../utils/filename.js";
import { isBackupData } from "../utils/validators.js";
import {
  normalizeChildProfile,
  normalizeFutureLetter,
  normalizeMemory,
} from "../utils/schema.js";

export function memoryTxtContent(memory, ageSubPaths) {
  return [
    "KHOBAUKYUC - GHICHU KY NIEM",
    "",
    `ID: ${memory.id}`,
    `Ngay: ${memory.date_code}`,
    `Tuoi: ${memory.age_stage}`,
    `Su kien: ${memory.event_type}`,
    `Tieu de: ${memory.title}`,
    `Cam xuc: ${memory.emotion}`,
    `Tags: ${(memory.tags || []).join(", ")}`,
    "",
    "Ghi chu:",
    memory.note || "",
    "",
    `Ghi chu cua bo me: ${memory.parentNote || ""}`,
    `Cau noi cua con: ${memory.childQuote || ""}`,
    `Dia diem: ${memory.location || ""}`,
    `Nguoi tham gia: ${(memory.people || []).join(", ")}`,
    "",
    `Google Drive anh: ${memory.drive_image_folder || ""}`,
    `YouTube: ${memory.youtube_link || ""}`,
    `Google Drive video: ${memory.drive_video_link || ""}`,
    "",
    "Thu muc goi y:",
    memory.suggested_folders
      ? Object.values(memory.suggested_folders).join("\n")
      : ageSubPaths(memory.age_stage).join("\n"),
  ].join("\n");
}

export function futureLetterTxtContent(letter) {
  return [
    "KHOBAUKYUC - THU GUI CON TUONG LAI",
    "",
    `ID: ${letter.id}`,
    `Child ID: ${letter.childId}`,
    `Tieu de: ${letter.title}`,
    `Tuoi muon gui: ${letter.targetAge || ""}`,
    `Ngay muon gui: ${letter.targetDate || ""}`,
    `Ngay tao: ${letter.createdAt ? new Date(letter.createdAt).toISOString() : ""}`,
    "",
    "Noi dung:",
    letter.body || "",
  ].join("\n");
}

export function exportBackupJson(memories, profiles, settings, futureLetters = []) {
  const backup = {
    app_name: "KHOBAUKYUC",
    version: "4.0",
    schemaVersion: SCHEMA_VERSION,
    root_folder: ROOT_FOLDER,
    exported_at: new Date().toISOString(),
    folder_structure: FOLDER_STRUCTURE,
    settings,
    profiles: profiles.map(normalizeChildProfile),
    memories: memories.map(normalizeMemory),
    futureLetters: futureLetters.map(normalizeFutureLetter),
  };
  const filename = `${yymmddFromDate(todayIso())}_backup_memories.json`;
  downloadBlob(
    new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
    filename,
  );
}

export async function importBackupFile(file, importData, saveSettings) {
  const data = JSON.parse(await file.text());
  if (!isBackupData(data)) throw new Error("File khong co memories");
  const profiles =
    Array.isArray(data.profiles) && data.profiles.length
      ? data.profiles.map(normalizeChildProfile)
      : [normalizeChildProfile(DEFAULT_CHILD_PROFILE)];
  const memories = data.memories.map(normalizeMemory);
  const futureLetters = Array.isArray(data.futureLetters)
    ? data.futureLetters.map(normalizeFutureLetter)
    : [];
  await importData(memories, profiles, futureLetters);
  if (data.settings) saveSettings(data.settings);
}

export function exportMemoryTxt(memory, ageSubPaths) {
  const filename = `${safeFileBase(memory)}_ghichu.txt`;
  downloadBlob(
    new Blob([memoryTxtContent(memory, ageSubPaths)], {
      type: "text/plain;charset=utf-8",
    }),
    filename,
  );
}

export async function exportZipBackup(
  memories,
  profiles,
  settings,
  ageSubPaths,
  futureLetters = [],
) {
  if (!window.JSZip) return false;

  const zip = new window.JSZip();
  const rootZip = zip.folder(ROOT_FOLDER);
  rootZip.folder("00_CONFIG").folder("backup");
  for (const age of AGE_STAGES) {
    const ageFolder = rootZip.folder(age);
    ageFolder.folder("ANH_OFFLINE");
    ageFolder.folder("ANH_GOC_GOOGLEDRIVE");
    ageFolder.folder("VIDEO_YOUTUBE");
    ageFolder.folder("GHICHU");
  }
  const specialEvents = rootZip.folder("SU_KIEN_DAC_BIET");
  EVENT_TYPES.forEach((eventType) => specialEvents.folder(eventType));

  const backup = {
    app_name: "KHOBAUKYUC",
    version: "4.0",
    schemaVersion: SCHEMA_VERSION,
    root_folder: ROOT_FOLDER,
    exported_at: new Date().toISOString(),
    folder_structure: FOLDER_STRUCTURE,
    settings,
    profiles: profiles.map(normalizeChildProfile),
    memories: memories.map(normalizeMemory),
    futureLetters: futureLetters.map(normalizeFutureLetter),
  };
  rootZip
    .folder("00_CONFIG")
    .file("memories.json", JSON.stringify(backup, null, 2));
  rootZip.folder("00_CONFIG").file(
    "folder_map.json",
    JSON.stringify(
      {
        root: ROOT_FOLDER,
        date_format: "YYMMDD",
        age_stages: AGE_STAGES,
        event_types: EVENT_TYPES,
      },
      null,
      2,
    ),
  );

  for (const memory of memories) {
    const age = memory.age_stage || DEFAULT_AGE_STAGE;
    const base = safeFileBase(memory);
    const ageFolder = rootZip.folder(age);
    ageFolder
      .folder("GHICHU")
      .file(`${base}_ghichu.txt`, memoryTxtContent(memory, ageSubPaths));
    for (let index = 0; index < (memory.photos || []).length; index += 1) {
      const photo = memory.photos[index];
      ageFolder
        .folder("ANH_OFFLINE")
        .file(
          `${base}_${String(index + 1).padStart(3, "0")}.jpg`,
          dataUrlToBlob(photo.dataUrl),
        );
    }
  }

  const lettersFolder = rootZip.folder("THU_GUI_CON_TUONG_LAI");
  for (const letter of futureLetters.map(normalizeFutureLetter)) {
    lettersFolder.file(`${safeFileName(letter.title || letter.id)}.txt`, futureLetterTxtContent(letter));
  }

  const output = await zip.generateAsync({ type: "blob" });
  downloadBlob(output, `${yymmddFromDate(todayIso())}_KHOBAUKYUC_backup.zip`);
  return true;
}

function safeFileName(value) {
  return String(value || "future-letter")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "future-letter";
}

export function dataUrlToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}
