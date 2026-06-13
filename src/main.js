import { DEFAULT_AGE_STAGE } from "./constants/age-stages.js";
import {
  BACKUP_HEALTH_KEY,
  DEFAULT_SETTINGS,
  FOLDER_STRUCTURE,
  ROOT_FOLDER,
  SETTINGS_KEY,
} from "./constants/app.js";
import {
  DEFAULT_BACKUP_STATUS,
  DEFAULT_CHILD_PROFILE,
  MEMORY_SCHEMA_VERSION,
} from "./constants/schema.js";
import {
  deleteMemory,
  deleteFutureLetter,
  getAllFutureLetters,
  getAllMemories,
  getAllProfiles,
  importData,
  openDatabase,
  putFutureLetter,
  putMemory,
  putProfile,
} from "./db/indexeddb-service.js";
import {
  exportBackupJson,
  exportMemoryTxt,
  exportZipBackup,
} from "./services/backup-export-service.js";
import {
  createImportPreview,
  prepareImportRecords,
} from "./services/import-preview-service.js";
import { getBrowserStorageEstimate } from "./services/storage-quota-service.js";
import {
  chooseOfflineFolder,
  hasOfflineDirectory,
  isFileSystemSupported,
  saveMemoryFilesToFolder,
} from "./services/file-system-service.js";
import { listPublicFolder, openUrl } from "./services/google-drive-service.js";
import { compressImage } from "./services/image-compression-service.js";
import {
  closeEditor,
  initializeEditor,
  openEditor,
  readEditorValues,
  setEditorMode,
  updateEditorHints,
} from "./ui/editor-renderer.js";
import {
  bindBackupHealthActions,
  renderBackupHealth,
} from "./ui/backup-health-renderer.js";
import {
  renderMemoryGrid,
  renderStats,
} from "./ui/memory-grid-renderer.js";
import { renderFamilyHome } from "./ui/home-renderer.js";
import {
  closeLetterEditor,
  closeLetterViewer,
  openLetterEditor,
  openLetterViewer,
  readLetterEditorValues,
  renderFutureLetters,
} from "./ui/future-letters-renderer.js";
import {
  closeSettings,
  openSettings,
  readSettingsValues,
} from "./ui/settings-renderer.js";
import {
  bindImportPreviewActions,
  closeImportPreview,
  openImportPreview,
  readImportStrategy,
} from "./ui/import-preview-renderer.js";
import { renderAgeFilter, renderTimeline } from "./ui/timeline-renderer.js";
import { closeViewer, openViewer } from "./ui/viewer-renderer.js";
import { dateFromYYMMDD, yymmddFromDate } from "./utils/date.js";
import { $, copyText, escapeHtml, toast } from "./utils/dom.js";
import { makeMemoryId, slug } from "./utils/filename.js";
import {
  isValidDateCode,
  isValidDriveUrl,
  isValidYoutubeUrl,
} from "./utils/validators.js";
import { normalizeFutureLetter, normalizeMemory } from "./utils/schema.js";

let memories = [];
let profiles = [];
let futureLetters = [];
let editingId = null;
let currentAge = "all";
let settings = loadSettings();
let backupHealth = loadBackupHealth();
let storageEstimate = { supported: false };
let pendingImportPreview = null;
let deferredInstallPrompt = null;

function loadSettings() {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(nextSettings) {
  settings = { ...settings, ...nextSettings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadBackupHealth() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_HEALTH_KEY) || "{}");
  } catch {
    return {};
  }
}

function markBackupComplete() {
  backupHealth = { lastBackupAt: Date.now() };
  localStorage.setItem(BACKUP_HEALTH_KEY, JSON.stringify(backupHealth));
  renderBackupHealth(
    memories,
    futureLetters,
    backupHealth.lastBackupAt,
    backupChecklist(),
    storageEstimate,
    { onEditMemory: editMemory },
  );
}

async function refresh() {
  memories = (await getAllMemories()).sort((a, b) =>
    (b.date_code || "").localeCompare(a.date_code || ""),
  );
  profiles = await getAllProfiles();
  futureLetters = (await getAllFutureLetters()).sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
  );
  storageEstimate = await getStorageEstimate();
  renderAll();
}

function renderAll() {
  renderTimeline(memories, currentAge, selectAge, addAtAge);
  renderAgeFilter(currentAge);
  renderMemoryGrid(filteredMemories(), currentAge, {
    onView: viewMemory,
    onEdit: editMemory,
    onFavorite: toggleFavorite,
    onExportTxt: exportTxt,
  });
  renderFamilyHome(memories, { onOpenMemory: viewMemory });
  renderFutureLetters(futureLetters, {
    onView: viewFutureLetter,
    onEdit: editFutureLetter,
    onDelete: deleteFutureLetterById,
  });
  renderStats(memories);
  renderBackupHealth(
    memories,
    futureLetters,
    backupHealth.lastBackupAt,
    backupChecklist(),
    storageEstimate,
    { onEditMemory: editMemory },
  );
  updateCurrentPathBox();
  updateFsStatus();
}

async function getStorageEstimate() {
  try {
    return await getBrowserStorageEstimate();
  } catch {
    return { supported: false };
  }
}

function filteredMemories() {
  const query = slug($("searchInput").value);
  const type = $("typeFilter").value;
  return memories.filter((memory) => {
    if (currentAge !== "all" && memory.age_stage !== currentAge) return false;
    if ($("ageFilter").value !== "all" && memory.age_stage !== $("ageFilter").value)
      return false;
    if (type === "offline" && !(memory.photos || []).length) return false;
    if (type === "youtube" && !memory.youtube_link) return false;
    if (
      type === "drive" &&
      !(memory.drive_image_folder || memory.drive_video_link)
    )
      return false;
    if (type === "fav" && !memory.favorite) return false;
    if (
      query &&
      !slug(
        [
          memory.title,
          memory.note,
          memory.parentNote,
          memory.childQuote,
          memory.location,
          (memory.people || []).join(" "),
          (memory.tags || []).join(" "),
          memory.date_code,
          memory.age_stage,
          memory.event_type,
        ].join(" "),
      ).includes(query)
    )
      return false;
    return true;
  });
}

function selectAge(age) {
  currentAge = age;
  renderAll();
}

function addAtAge(age) {
  editingId = null;
  openEditor(null, age, "quick");
}

function addTodayMemory() {
  editingId = null;
  openEditor(null, currentAge !== "all" ? currentAge : null, "quick");
}

function reopenRandomMemory() {
  if (!memories.length) {
    toast("Chua co ky niem nao de mo lai");
    return;
  }
  const memory = memories[Math.floor(Math.random() * memories.length)];
  openViewer(memory);
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateConnectionStatus() {
  const status = document.getElementById("connectionStatusText");
  if (!status) return;
  if (navigator.onLine) {
    status.textContent = "Dang online";
    status.className = "pwaOnline";
    return;
  }
  status.textContent = "Dang offline - du lieu tren thiet bi nay van xem duoc";
  status.className = "pwaOffline";
}

function bindPwaControls() {
  updateConnectionStatus();
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);

  const installButton = document.getElementById("installAppBtn");
  const manualButton = document.getElementById("manualInstallBtn");
  const installHelp = document.getElementById("installHelpText");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.disabled = false;
    if (installHelp) {
      installHelp.textContent =
        "Trinh duyet nay ho tro cai KHOBAUKYUC vao man hinh chinh.";
    }
  });

  if (installButton) {
    installButton.onclick = async () => {
      if (!deferredInstallPrompt) {
        toast("Neu khong thay nut cai app, hay dung menu trinh duyet: Add to Home Screen hoac Install app.");
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
    };
  }

  if (manualButton) {
    manualButton.onclick = () =>
      toast("Mobile: mo menu trinh duyet va chon Add to Home Screen. Desktop: chon Install app neu trinh duyet ho tro.");
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // Offline shell is optional; IndexedDB and backups continue to work.
    });
  });
}

function editMemory(id) {
  editingId = id;
  openEditor(memories.find((memory) => memory.id === id), null, "full");
}

function viewMemory(id) {
  openViewer(memories.find((memory) => memory.id === id));
}

async function toggleFavorite(id) {
  const memory = memories.find((item) => item.id === id);
  memory.favorite = !memory.favorite;
  await putMemory(memory);
  await refresh();
}

function exportTxt(id) {
  const memory = memories.find((item) => item.id === id);
  if (!memory) return;
  exportMemoryTxt(memory, ageSubPaths);
  toast("Da xuat file ghi chu TXT");
}

function addFutureLetter(preset = {}) {
  openLetterEditor({
    title: preset.title || "",
    targetAge: preset.targetAge || "",
    targetDate: "",
    body: "",
  });
}

function viewFutureLetter(id) {
  openLetterViewer(futureLetters.find((letter) => letter.id === id));
}

function editFutureLetter(id) {
  openLetterEditor(futureLetters.find((letter) => letter.id === id));
}

async function deleteFutureLetterById(id) {
  if (!confirm("Xoa la thu nay?")) return;
  await deleteFutureLetter(id);
  await refresh();
  toast("Da xoa thu");
}

async function saveFutureLetter() {
  const values = readLetterEditorValues();
  const old = values.id
    ? futureLetters.find((letter) => letter.id === values.id)
    : null;
  const now = Date.now();
  const letter = normalizeFutureLetter({
    ...old,
    ...values,
    id: old?.id || `letter_${now}`,
    childId: old?.childId || DEFAULT_CHILD_PROFILE.id,
    createdAt: old?.createdAt || now,
    updatedAt: now,
  });
  await putFutureLetter(letter);
  closeLetterEditor();
  await refresh();
  toast("Da luu thu");
}

async function saveCurrentMemory() {
  const values = readEditorValues();
  if (!isValidDateCode(values.dateCode)) {
    toast("Ngay he thong phai la YYMMDD, vi du 260509");
    return;
  }
  if (!isValidDriveUrl(values.driveImageFolder)) {
    toast("Link anh goc phai la link https://drive.google.com");
    return;
  }
  if (!isValidYoutubeUrl(values.youtubeLink)) {
    toast("Link YouTube khong hop le");
    return;
  }
  if (!isValidDriveUrl(values.driveVideoLink)) {
    toast("Link video goc phai la link https://drive.google.com");
    return;
  }

  const old = editingId
    ? memories.find((memory) => memory.id === editingId)
    : null;
  const photos = old?.photos || [];
  if (values.files.length) {
    toast("Dang nen anh offline...");
    for (const file of values.files) photos.push(await compressImage(file));
  }

  const now = Date.now();
  const memory = normalizeMemory({
    id: old?.id || makeMemoryId(values.dateCode),
    schemaVersion: MEMORY_SCHEMA_VERSION,
    childId: old?.childId || DEFAULT_CHILD_PROFILE.id,
    date_iso: values.dateIso || dateFromYYMMDD(values.dateCode),
    date_code: values.dateCode,
    age_stage: values.ageStage,
    event_type: values.eventType,
    title: values.title,
    title_slug: slug(values.title),
    emotion: values.emotion,
    tags: values.tagsText
      .split(",")
      .map((tag) => slug(tag))
      .filter(Boolean),
    note: values.note,
    parentNote: values.parentNote,
    childQuote: values.childQuote,
    location: values.location,
    people: values.peopleText
      .split(",")
      .map((person) => person.trim())
      .filter(Boolean),
    backupStatus: old?.backupStatus || DEFAULT_BACKUP_STATUS,
    photos,
    drive_image_folder: values.driveImageFolder,
    youtube_link: values.youtubeLink,
    youtube_embed: youtubeEmbed(values.youtubeLink),
    drive_video_link: values.driveVideoLink,
    favorite: old?.favorite || false,
    created_at: old?.created_at || old?.createdAt || now,
    updated_at: now,
    createdAt: old?.createdAt || old?.created_at || now,
    updatedAt: now,
    suggested_folders: {
      image: `${ROOT_FOLDER}/${values.ageStage}/ANH_GOC_GOOGLEDRIVE/`,
      youtube: `${ROOT_FOLDER}/${values.ageStage}/VIDEO_YOUTUBE/`,
      note: `${ROOT_FOLDER}/${values.ageStage}/GHICHU/`,
      event: `${ROOT_FOLDER}/SU_KIEN_DAC_BIET/${values.eventType}/`,
    },
  });

  await putMemory(memory);
  if (hasOfflineDirectory()) {
    try {
      if (await saveMemoryFilesToFolder(memory, ageSubPaths, profiles))
        await putMemory(memory);
    } catch (error) {
      toast(`Loi luu ra thu muc: ${error.message}`);
    }
  }
  await refresh();
  closeEditor();
  toast("Da luu ky niem");
}

async function deleteCurrentMemory() {
  if (!editingId || !confirm("Xoa ky niem nay?")) return;
  await deleteMemory(editingId);
  await refresh();
  closeEditor();
  toast("Da xoa");
}

function youtubeEmbed(url) {
  const value = String(url || "");
  let id = "";
  if (value.includes("youtu.be/")) id = value.split("youtu.be/")[1].split(/[?&]/)[0];
  else if (value.includes("watch?v=")) id = value.split("watch?v=")[1].split("&")[0];
  else if (value.includes("/embed/")) id = value.split("/embed/")[1].split(/[?&]/)[0];
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

function ageSubPaths(age = currentAge) {
  const selectedAge = age && age !== "all" ? age : DEFAULT_AGE_STAGE;
  return [
    `${ROOT_FOLDER}/${selectedAge}/`,
    `${ROOT_FOLDER}/${selectedAge}/ANH_OFFLINE/`,
    `${ROOT_FOLDER}/${selectedAge}/ANH_GOC_GOOGLEDRIVE/`,
    `${ROOT_FOLDER}/${selectedAge}/VIDEO_YOUTUBE/`,
    `${ROOT_FOLDER}/${selectedAge}/GHICHU/`,
    `${ROOT_FOLDER}/00_CONFIG/backup/`,
  ];
}

function updateCurrentPathBox() {
  $("currentPathText").textContent = ageSubPaths().join("\n");
}

function updateFsStatus() {
  if (isFileSystemSupported() && hasOfflineDirectory()) {
    $("fsStatus").textContent =
      "Da chon thu muc offline that. Anh moi se duoc luu ra thu muc neu trinh duyet cho phep.";
    $("fsStatus").className = "fsOk";
  } else if (isFileSystemSupported()) {
    $("fsStatus").textContent =
      "Trinh duyet ho tro chon thu muc. Hay bam Chon thu muc KHOBAUKYUC de luu file that.";
    $("fsStatus").className = "fsWarn";
  } else {
    $("fsStatus").textContent =
      "Trinh duyet nay chua ho tro mo/ghi thu muc that. App se dung IndexedDB va Export ZIP de backup.";
    $("fsStatus").className = "fsWarn";
  }
  $("offlinePathText").textContent = ageSubPaths().join("\n");
}

function backupChecklist() {
  const age = currentAge !== "all" ? currentAge : DEFAULT_AGE_STAGE;
  return [
    "CHECKLIST BACKUP THU CONG - KHOBAUKYUC",
    "",
    "1. Bam nut Backup trong app de tai file JSON.",
    `2. Luu file backup vao: ${ROOT_FOLDER}/00_CONFIG/backup/`,
    `3. Anh goc luu vao: ${ROOT_FOLDER}/${age}/ANH_GOC_GOOGLEDRIVE/`,
    `4. Video YouTube luu link vao: ${ROOT_FOLDER}/${age}/VIDEO_YOUTUBE/`,
    `5. Ghi chu su kien luu vao: ${ROOT_FOLDER}/${age}/GHICHU/`,
    "6. Dinh ky copy memories.json/backup JSON len Google Drive.",
    "",
    "Quy tac ten file:",
    "YYMMDD_su-kien_001.jpg",
    "YYMMDD_su-kien_youtube.txt",
    "YYMMDD_su-kien_ghichu.txt",
  ].join("\n");
}

function familyDriveChecklist() {
  return [
    "FAMILY DRIVE CHECKLIST - KHOBAUKYUC",
    "",
    "1. Upload anh/video goc len Google Drive bang thao tac thu cong.",
    "2. Dung thu muc goc KHOBAUKYUC va chon dung giai doan tuoi.",
    "3. Doi ten file theo Suggested Filename trong editor.",
    "4. Dan link thu muc anh goc, link YouTube va link Drive video vao ky niem.",
    "5. Kiem tra Media Upload Queue de bo sung cac link con thieu.",
    "6. Khong xoa anh/video goc sau khi da luu link.",
    "7. Export JSON sau dot nhap lieu va Export ZIP moi thang.",
    "8. Luu anh/video goc va backup o it nhat hai noi.",
    "",
    "Luu y: Du lieu tren cac dien thoai khong tu dong dong bo voi nhau.",
  ].join("\n");
}

function copyStructure() {
  copyText(
    `${ROOT_FOLDER}/\n${FOLDER_STRUCTURE.map((path) => `  ${path}`).join("\n")}`,
    "Da copy cau truc thu muc",
  );
}

async function exportJsonBackup() {
  await exportBackupJson(memories, profiles, settings, futureLetters);
  markBackupComplete();
  toast("Da export backup JSON");
}

async function exportZipOrFallback() {
  const exported = await exportZipBackup(
    memories,
    profiles,
    settings,
    ageSubPaths,
    futureLetters,
  );
  if (exported) {
    markBackupComplete();
    toast("Da export ZIP KHOBAUKYUC.");
    return;
  }
  toast("Can internet lan dau de tai JSZip hoac dung Backup JSON.");
  await exportBackupJson(memories, profiles, settings, futureLetters);
  markBackupComplete();
}

async function handleImport(file) {
  try {
    pendingImportPreview = await createImportPreview(file, {
      profiles,
      memories,
      futureLetters,
    });
    openImportPreview(pendingImportPreview);
  } catch (error) {
    toast(`Loi import: ${error.message}`);
  } finally {
    $("importInput").value = "";
  }
}

async function confirmImportPreview() {
  if (!pendingImportPreview) return;
  const strategy = readImportStrategy();
  const messages = [
    "Ban dang chuan bi import du lieu backup. Hay chac chan da export JSON/ZIP backup hien tai truoc khi tiep tuc.",
  ];
  if (strategy === "overwriteExisting") {
    messages.push(
      "Che do ghi de co the thay the ky uc hien tai neu trung ID.",
    );
  }
  if (!confirm(messages.join("\n\n"))) return;

  try {
    const prepared = prepareImportRecords(pendingImportPreview, strategy);
    await importData(prepared.memories, prepared.profiles, prepared.futureLetters);
    if (strategy === "overwriteExisting" && pendingImportPreview.data.settings) {
      persistSettings(pendingImportPreview.data.settings);
    }
    pendingImportPreview = null;
    closeImportPreview();
    await refresh();
    toast("Da phuc hoi backup");
  } catch (error) {
    toast(`Loi import: ${error.message}`);
  }
}

function cancelImportPreview() {
  pendingImportPreview = null;
  closeImportPreview();
  toast("Da huy import");
}

async function saveExistingPhotos() {
  try {
    if (!hasOfflineDirectory()) await chooseOfflineFolder();
    let count = 0;
    for (const memory of memories) {
      if (await saveMemoryFilesToFolder(memory, ageSubPaths, profiles)) {
        await putMemory(memory);
        count += 1;
      }
    }
    await refresh();
    toast(`Da dong bo ${count} ky niem ra thu muc offline.`);
  } catch (error) {
    toast(`Chua chon thu muc: ${error.message || ""}`);
  }
}

function storyMode() {
  const list = filteredMemories();
  if (!list.length) {
    toast("Chua co ky niem de chay story");
    return;
  }
  let index = 0;
  const overlay = document.createElement("div");
  overlay.className = "story";
  const render = () => {
    const memory = list[index % list.length];
    const image = memory.photos?.[0]?.dataUrl;
    overlay.innerHTML =
      '<button class="secondary storyClose">Dong</button><div class="storyText">' +
      `${image ? `<img src="${image}">` : "<div style='font-size:90px'>💖</div>"}` +
      `<h2>${escapeHtml(memory.title)}</h2><p>${memory.date_code} • ${memory.age_stage}</p>` +
      `<p>${escapeHtml(memory.note || "")}</p></div>`;
    overlay.querySelector(".storyClose").onclick = () => overlay.remove();
    index += 1;
  };
  render();
  document.body.appendChild(overlay);
  const timer = setInterval(() => {
    if (!document.body.contains(overlay)) {
      clearInterval(timer);
      return;
    }
    render();
  }, 4500);
}

function bindEvents() {
  $("addBtn").onclick = () => {
    editingId = null;
    openEditor(null, currentAge !== "all" ? currentAge : null, "quick");
  };
  $("addTodayBtn").onclick = addTodayMemory;
  $("viewArchiveBtn").onclick = () => scrollToSection("memoryArchive");
  $("protectDataBtn").onclick = () => scrollToSection("backupCenter");
  $("reopenMemoryBtn").onclick = reopenRandomMemory;
  $("closeEditorBtn").onclick = closeEditor;
  $("saveMemoryBtn").onclick = saveCurrentMemory;
  $("deleteMemoryBtn").onclick = deleteCurrentMemory;
  $("dateInput").onchange = () => {
    $("dateCodeInput").value = yymmddFromDate($("dateInput").value);
    updateEditorHints();
  };
  $("quickModeBtn").onclick = () => setEditorMode("quick");
  $("fullModeBtn").onclick = () => setEditorMode("full");
  ["dateCodeInput", "titleInput", "eventInput", "ageInput", "photoInput"].forEach((id) => {
    $(id).addEventListener("input", updateEditorHints);
  });
  $("photoInput").addEventListener("change", updateEditorHints);
  $("settingsBtn").onclick = () => openSettings(settings);
  $("closeSettingsBtn").onclick = closeSettings;
  $("saveSettingsBtn").onclick = () => {
    const values = readSettingsValues();
    if (values.rootFolder !== ROOT_FOLDER) {
      toast("Ten root bat buoc la KHOBAUKYUC");
      return;
    }
    if (!isValidDriveUrl(values.driveRootUrl)) {
      toast("Drive Root Folder Link phai la link https://drive.google.com");
      return;
    }
    persistSettings(values);
    closeSettings();
    toast("Da luu cau hinh");
  };
  $("testDriveBtn").onclick = async () => {
    try {
      const files = await listPublicFolder(
        $("apiKeyInput").value.trim(),
        $("driveRootInput").value.trim(),
      );
      toast(`Doc duoc ${files.length} muc trong folder`);
    } catch (error) {
      toast(`Loi Drive: ${error.message}`);
    }
  };
  $("backupBtn").onclick = exportJsonBackup;
  $("importBtn").onclick = () => $("importInput").click();
  $("importInput").onchange = (event) => {
    if (event.target.files[0]) handleImport(event.target.files[0]);
  };
  $("copyStructureBtn").onclick = copyStructure;
  $("checkStructureBtn").onclick = () =>
    toast("Ban V1 kiem tra bang cau truc text. Ban Pro se quet Drive API de bao thieu thu muc.");
  $("syncDriveBtn").onclick = async () => {
    try {
      const files = await listPublicFolder(settings.apiKey, settings.driveRootUrl);
      toast(`Da quet Drive root: ${files.length} muc. Ban Pro se quet de quy thu muc con.`);
    } catch (error) {
      toast(`Loi dong bo Drive: ${error.message}`);
    }
  };
  $("searchInput").oninput = () =>
    renderMemoryGrid(filteredMemories(), currentAge, {
      onView: viewMemory,
      onEdit: editMemory,
      onFavorite: toggleFavorite,
      onExportTxt: exportTxt,
    });
  $("ageFilter").onchange = (event) => selectAge(event.target.value);
  $("typeFilter").onchange = renderAll;
  $("clearBtn").onclick = () => {
    $("searchInput").value = "";
    $("typeFilter").value = "all";
    currentAge = "all";
    renderAll();
  };
  $("storyBtn").onclick = storyMode;
  $("closeViewerBtn").onclick = closeViewer;
  $("viewer").onclick = (event) => {
    if (event.target.id === "viewer") closeViewer();
  };
  ["editor", "settings"].forEach((id) => {
    $(id).onclick = (event) => {
      if (event.target.id === id) $(id).classList.remove("open");
    };
  });
  $("openRootDriveBtn").onclick = () => {
    try {
      openUrl(settings.driveRootUrl, "Chua nhap link KHOBAUKYUC trong Cai dat");
    } catch (error) {
      toast(error.message);
    }
  };
  $("openAgeDriveBtn").onclick = $("openRootDriveBtn").onclick;
  $("openBackupDriveBtn").onclick = $("openRootDriveBtn").onclick;
  $("copyRootPathBtn").onclick = () =>
    copyText(`${ROOT_FOLDER}/`, "Da copy root path");
  $("copyAgePathBtn").onclick = () =>
    copyText(ageSubPaths().join("\n"), "Da copy duong dan tuoi dang xem");
  $("copyBackupChecklistBtn").onclick = () =>
    copyText(backupChecklist(), "Da copy checklist backup");
  $("copyFamilyDriveChecklistBtn").onclick = () =>
    copyText(familyDriveChecklist(), "Da copy Family Drive Checklist");
  $("openMediaQueueBtn").onclick = () => scrollToSection("mediaUploadQueue");
  $("chooseOfflineFolderBtn").onclick = async () => {
    try {
      await chooseOfflineFolder();
      updateFsStatus();
      toast("Da chon va tao cau truc thu muc offline.");
    } catch (error) {
      toast(`Chua chon thu muc: ${error.message || ""}`);
    }
  };
  $("saveExistingPhotosBtn").onclick = saveExistingPhotos;
  $("exportZipBtn").onclick = exportZipOrFallback;
  $("copyOfflinePathBtn").onclick = () =>
    copyText($("offlinePathText").textContent || `${ROOT_FOLDER}/`, "Da copy offline path");
  $("addFutureLetterBtn").onclick = () => addFutureLetter();
  document.querySelectorAll(".letterExampleBtn").forEach((button) => {
    button.onclick = () =>
      addFutureLetter({
        title: button.dataset.title,
        targetAge: button.dataset.age,
      });
  });
  $("saveFutureLetterBtn").onclick = saveFutureLetter;
  $("closeLetterEditorBtn").onclick = closeLetterEditor;
  $("closeLetterViewerBtn").onclick = closeLetterViewer;
  $("futureLetterEditor").onclick = (event) => {
    if (event.target.id === "futureLetterEditor") closeLetterEditor();
  };
  $("futureLetterViewer").onclick = (event) => {
    if (event.target.id === "futureLetterViewer") closeLetterViewer();
  };
  bindBackupHealthActions({
    onExportJson: exportJsonBackup,
    onExportZip: exportZipOrFallback,
    onImportJson: () => $("importInput").click(),
  });
  bindImportPreviewActions({
    onCancel: cancelImportPreview,
    onConfirm: confirmImportPreview,
  });
}

async function start() {
  await openDatabase();
  profiles = await getAllProfiles();
  if (!profiles.length) await putProfile(DEFAULT_CHILD_PROFILE);
  initializeEditor();
  updateEditorHints();
  bindPwaControls();
  registerServiceWorker();
  bindEvents();
  await refresh();
}

start().catch((error) => toast(`Loi khoi dong: ${error.message}`));
