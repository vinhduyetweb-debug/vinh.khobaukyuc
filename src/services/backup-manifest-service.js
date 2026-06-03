import { ROOT_FOLDER } from "../constants/app.js";
import { SCHEMA_VERSION } from "../constants/schema.js";
import { DB_NAME, DB_VERSION } from "../db/indexeddb-service.js";

const APP_NAME = "KHOBAUKYUC";
const APP_VERSION = "5.3";
const CHECKSUM_ALGORITHM = "SHA-256";

export async function createBackupPackage({
  settings,
  profiles,
  memories,
  futureLetters,
  folderStructure,
}) {
  const exportedAt = new Date().toISOString();
  const payload = {
    app_name: APP_NAME,
    version: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    root_folder: ROOT_FOLDER,
    exported_at: exportedAt,
    folder_structure: folderStructure,
    settings,
    profiles,
    memories,
    futureLetters,
  };
  const manifest = await createBackupManifest(payload, exportedAt);
  return {
    ...payload,
    manifest,
  };
}

export async function createBackupManifest(payload, createdAt) {
  const warnings = [];
  const checksumSupported = isSha256Supported();
  const payloadText = stableStringify(payload);

  if (!checksumSupported) {
    warnings.push("SHA-256 checksum is not supported in this browser.");
  }

  return {
    backupId: createBackupId(createdAt),
    appName: APP_NAME,
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    createdAt,
    databaseName: DB_NAME,
    databaseVersion: DB_VERSION,
    totalProfiles: payload.profiles.length,
    totalMemories: payload.memories.length,
    totalOfflinePhotos: countOfflinePhotos(payload.memories),
    totalFutureLetters: payload.futureLetters.length,
    totalOnlineLinks: countOnlineLinks(payload.memories),
    estimatedPhotoBytes: estimatePhotoBytes(payload.memories),
    estimatedJsonBytes: new TextEncoder().encode(payloadText).length,
    checksumAlgorithm: checksumSupported ? CHECKSUM_ALGORITHM : null,
    payloadChecksum: checksumSupported ? await sha256(payloadText) : null,
    recordChecksums: checksumSupported
      ? await createRecordChecksums(payload)
      : null,
    warnings,
  };
}

export function isSha256Supported() {
  return Boolean(globalThis.crypto?.subtle?.digest);
}

async function createRecordChecksums(payload) {
  return {
    profiles: await Promise.all(
      payload.profiles.map(async (profile) => ({
        id: profile.id,
        checksum: await sha256(stableStringify(profile)),
      })),
    ),
    memories: await Promise.all(
      payload.memories.map(async (memory) => ({
        id: memory.id,
        checksum: await sha256(stableStringify(withoutPhotos(memory))),
        photoChecksums: await Promise.all(
          (memory.photos || []).map(async (photo, index) => ({
            index,
            name: photo.name || "",
            checksum: await sha256(photo.dataUrl || ""),
          })),
        ),
      })),
    ),
    futureLetters: await Promise.all(
      payload.futureLetters.map(async (letter) => ({
        id: letter.id,
        checksum: await sha256(stableStringify(letter)),
      })),
    ),
  };
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await globalThis.crypto.subtle.digest(CHECKSUM_ALGORITHM, bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createBackupId(createdAt) {
  const date = new Date(createdAt);
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "_",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
  return `${APP_NAME}_${stamp}_${randomSuffix()}`;
}

function randomSuffix() {
  const values = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
    return Array.from(values)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function countOfflinePhotos(memories) {
  return memories.reduce((sum, memory) => sum + (memory.photos || []).length, 0);
}

function countOnlineLinks(memories) {
  return memories.reduce(
    (sum, memory) =>
      sum +
      (memory.youtube_link ? 1 : 0) +
      (memory.drive_image_folder ? 1 : 0) +
      (memory.drive_video_link ? 1 : 0),
    0,
  );
}

function estimatePhotoBytes(memories) {
  return memories.reduce(
    (sum, memory) =>
      sum +
      (memory.photos || []).reduce(
        (photoSum, photo) => photoSum + (photo.size || 0),
        0,
      ),
    0,
  );
}

function withoutPhotos(memory) {
  const { photos, ...rest } = memory;
  return {
    ...rest,
    photoCount: (photos || []).length,
  };
}

function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = sortKeys(value[key]);
      return result;
    }, {});
}
