import { DEFAULT_CHILD_PROFILE } from "../constants/schema.js";
import {
  normalizeChildProfile,
  normalizeFutureLetter,
  normalizeMemory,
} from "../utils/schema.js";
import { isBackupData } from "../utils/validators.js";

export async function createImportPreview(file, currentData) {
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
  const records = { profiles, memories, futureLetters };
  const conflicts = compareWithCurrent(records, currentData);
  const manifest = data.manifest || null;

  return {
    data,
    records,
    source: {
      appName: data.app_name || manifest?.appName || "Unknown",
      backupVersion: data.version || manifest?.appVersion || "Unknown",
      schemaVersion: data.schemaVersion || manifest?.schemaVersion || "Unknown",
      exportedAt: data.exported_at || manifest?.createdAt || "Unknown",
      hasManifest: Boolean(manifest),
      hasChecksum: Boolean(manifest?.payloadChecksum),
    },
    totals: {
      profiles: profiles.length,
      memories: memories.length,
      offlinePhotos: countOfflinePhotos(memories),
      futureLetters: futureLetters.length,
      onlineLinks: countOnlineLinks(memories),
    },
    conflicts,
    warnings: buildWarnings(manifest),
  };
}

export function prepareImportRecords(preview, strategy) {
  if (strategy === "skipExisting") return skipExisting(preview);
  if (strategy === "duplicateAsNew") return duplicateAsNew(preview);
  return preview.records;
}

function compareWithCurrent(records, currentData) {
  const currentProfileIds = new Set(currentData.profiles.map((item) => item.id));
  const currentMemoryIds = new Set(currentData.memories.map((item) => item.id));
  const currentLetterIds = new Set(currentData.futureLetters.map((item) => item.id));
  const profilesToUpdate = countExisting(records.profiles, currentProfileIds);
  const memoriesToUpdate = countExisting(records.memories, currentMemoryIds);
  const futureLettersToUpdate = countExisting(records.futureLetters, currentLetterIds);

  return {
    profilesToAdd: records.profiles.length - profilesToUpdate,
    profilesToUpdate,
    memoriesToAdd: records.memories.length - memoriesToUpdate,
    memoriesToUpdate,
    futureLettersToAdd: records.futureLetters.length - futureLettersToUpdate,
    futureLettersToUpdate,
    totalConflicts: profilesToUpdate + memoriesToUpdate + futureLettersToUpdate,
    existingIds: {
      profiles: currentProfileIds,
      memories: currentMemoryIds,
      futureLetters: currentLetterIds,
    },
  };
}

function skipExisting(preview) {
  const { existingIds } = preview.conflicts;
  return {
    profiles: preview.records.profiles.filter(
      (profile) => !existingIds.profiles.has(profile.id),
    ),
    memories: preview.records.memories.filter(
      (memory) => !existingIds.memories.has(memory.id),
    ),
    futureLetters: preview.records.futureLetters.filter(
      (letter) => !existingIds.futureLetters.has(letter.id),
    ),
  };
}

function duplicateAsNew(preview) {
  const now = Date.now();
  const { existingIds } = preview.conflicts;
  return {
    profiles: preview.records.profiles.filter(
      (profile) => !existingIds.profiles.has(profile.id),
    ),
    memories: preview.records.memories.map((memory, index) =>
      existingIds.memories.has(memory.id)
        ? normalizeMemory({
            ...memory,
            id: makeImportedId(memory.id, now, index),
            importedFromId: memory.id,
            importedAt: now,
            createdAt: memory.createdAt || now,
            updatedAt: now,
          })
        : memory,
    ),
    futureLetters: preview.records.futureLetters.map((letter, index) =>
      existingIds.futureLetters.has(letter.id)
        ? normalizeFutureLetter({
            ...letter,
            id: makeImportedId(letter.id, now, index),
            importedFromId: letter.id,
            importedAt: now,
            createdAt: letter.createdAt || now,
            updatedAt: now,
          })
        : letter,
    ),
  };
}

function buildWarnings(manifest) {
  const warnings = [];
  if (!manifest) warnings.push("Backup cu chua co manifest/checksum.");
  else if (!manifest.payloadChecksum) warnings.push("Backup co manifest nhung chua co checksum.");
  return warnings;
}

function countExisting(records, existingIds) {
  return records.reduce((sum, record) => sum + (existingIds.has(record.id) ? 1 : 0), 0);
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

function makeImportedId(id, now, index) {
  return `${id}_import_${now}_${index + 1}`;
}
