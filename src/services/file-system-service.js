import { AGE_STAGES, DEFAULT_AGE_STAGE } from "../constants/age-stages.js";
import { EVENT_TYPES } from "../constants/event-types.js";
import { FOLDER_STRUCTURE, ROOT_FOLDER } from "../constants/app.js";
import { SCHEMA_VERSION } from "../constants/schema.js";
import { memoryTxtContent, dataUrlToBlob } from "./backup-export-service.js";
import { safeFileBase, slug } from "../utils/filename.js";

let offlineDirHandle = null;

export function isFileSystemSupported() {
  return "showDirectoryPicker" in window;
}

export function hasOfflineDirectory() {
  return Boolean(offlineDirHandle);
}

export async function chooseOfflineFolder() {
  if (!isFileSystemSupported()) {
    throw new Error(
      "Trinh duyet khong ho tro chon thu muc that. Hay dung Chrome/Edge Android/Windows hoac Export ZIP.",
    );
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  offlineDirHandle = handle;
  await ensureFolderStructure(handle);
  return handle;
}

async function getOrCreateDir(parent, name) {
  return parent.getDirectoryHandle(name, { create: true });
}

async function writeTextFile(dirHandle, filename, text) {
  const file = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  await writable.write(text);
  await writable.close();
}

async function writeBlobFile(dirHandle, filename, blob) {
  const file = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function ensureFolderStructure(rootHandle = offlineDirHandle) {
  const config = await getOrCreateDir(rootHandle, "00_CONFIG");
  await getOrCreateDir(config, "backup");
  for (const age of AGE_STAGES) {
    const ageDir = await getOrCreateDir(rootHandle, age);
    await getOrCreateDir(ageDir, "ANH_OFFLINE");
    await getOrCreateDir(ageDir, "ANH_GOC_GOOGLEDRIVE");
    await getOrCreateDir(ageDir, "VIDEO_YOUTUBE");
    await getOrCreateDir(ageDir, "GHICHU");
  }
  const specialEvents = await getOrCreateDir(rootHandle, "SU_KIEN_DAC_BIET");
  for (const eventType of EVENT_TYPES) {
    await getOrCreateDir(specialEvents, eventType);
  }
  await writeTextFile(
    config,
    "folder_map.json",
    JSON.stringify(
      {
        root: ROOT_FOLDER,
        date_format: "YYMMDD",
        age_stages: AGE_STAGES,
        event_types: EVENT_TYPES,
        folder_structure: FOLDER_STRUCTURE,
      },
      null,
      2,
    ),
  );
}

export async function saveMemoryFilesToFolder(memory, ageSubPaths, profiles = []) {
  if (!offlineDirHandle) return false;

  await ensureFolderStructure();
  const age = memory.age_stage || DEFAULT_AGE_STAGE;
  const ageDir = await getOrCreateDir(offlineDirHandle, age);
  const imageDir = await getOrCreateDir(ageDir, "ANH_OFFLINE");
  const noteDir = await getOrCreateDir(ageDir, "GHICHU");
  const base = safeFileBase(memory);

  for (let index = 0; index < (memory.photos || []).length; index += 1) {
    const photo = memory.photos[index];
    if (photo.saved_to_filesystem) continue;
    const filename = `${base}_${String(index + 1).padStart(3, "0")}.jpg`;
    await writeBlobFile(imageDir, filename, dataUrlToBlob(photo.dataUrl));
    photo.filesystem_path = `${ROOT_FOLDER}/${age}/ANH_OFFLINE/${filename}`;
    photo.saved_to_filesystem = true;
  }

  await writeTextFile(
    noteDir,
    `${base}_ghichu.txt`,
    memoryTxtContent(memory, ageSubPaths),
  );

  const config = await getOrCreateDir(offlineDirHandle, "00_CONFIG");
  const backup = await getOrCreateDir(config, "backup");
  const miniBackup = {
    app_name: "KHOBAUKYUC",
    version: "4.0",
    schemaVersion: SCHEMA_VERSION,
    root_folder: ROOT_FOLDER,
    exported_at: new Date().toISOString(),
    profiles,
    memories: [memory],
  };
  await writeTextFile(
    backup,
    `${memory.date_code || "260509"}_${slug(memory.title)}_backup.json`,
    JSON.stringify(miniBackup, null, 2),
  );
  return true;
}
