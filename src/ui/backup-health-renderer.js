import { $ } from "../utils/dom.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getBackupHealth(memories, lastBackupAt) {
  const totalMemories = memories.length;
  const totalOfflinePhotos = memories.reduce(
    (sum, memory) => sum + (memory.photos?.length || 0),
    0,
  );
  const estimatedStorageBytes = memories.reduce(
    (sum, memory) =>
      sum +
      (memory.photos || []).reduce(
        (photoSum, photo) => photoSum + (photo.size || 0),
        0,
      ),
    0,
  );
  const totalOnlineLinks = memories.reduce(
    (sum, memory) =>
      sum +
      (memory.youtube_link ? 1 : 0) +
      (memory.drive_image_folder ? 1 : 0) +
      (memory.drive_video_link ? 1 : 0),
    0,
  );
  const daysSinceBackup = lastBackupAt
    ? Math.max(0, Math.floor((Date.now() - lastBackupAt) / DAY_MS))
    : null;

  return {
    totalMemories,
    totalOfflinePhotos,
    estimatedStorageBytes,
    totalOnlineLinks,
    lastBackupAt,
    daysSinceBackup,
    status: getBackupStatus(daysSinceBackup),
  };
}

export function renderBackupHealth(memories, lastBackupAt, checklistText) {
  const health = getBackupHealth(memories, lastBackupAt);
  $("healthMemoryCount").textContent = health.totalMemories;
  $("healthPhotoCount").textContent = health.totalOfflinePhotos;
  $("healthStorageSize").textContent = formatBytes(health.estimatedStorageBytes);
  $("healthOnlineCount").textContent = health.totalOnlineLinks;
  $("healthLastBackup").textContent = health.lastBackupAt
    ? new Date(health.lastBackupAt).toLocaleDateString("vi-VN")
    : "Chua co";
  $("healthDaysSinceBackup").textContent =
    health.daysSinceBackup === null ? "Chua co" : String(health.daysSinceBackup);
  $("healthBackupStatus").textContent = health.status.label;
  $("healthBackupStatus").className = `backupStatus ${health.status.className}`;
  $("healthChecklistText").textContent = checklistText;
}

export function bindBackupHealthActions({
  onExportJson,
  onExportZip,
  onImportJson,
}) {
  $("healthExportJsonBtn").onclick = onExportJson;
  $("healthExportZipBtn").onclick = onExportZip;
  $("healthImportJsonBtn").onclick = onImportJson;
}

function getBackupStatus(daysSinceBackup) {
  if (daysSinceBackup === null || daysSinceBackup > 30) {
    return { label: "Warning", className: "warning" };
  }
  if (daysSinceBackup > 7) {
    return { label: "Should backup", className: "should" };
  }
  return { label: "Safe", className: "safe" };
}

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index += 1;
  }
  return `${bytes.toFixed(index ? 1 : 0)} ${units[index]}`;
}
