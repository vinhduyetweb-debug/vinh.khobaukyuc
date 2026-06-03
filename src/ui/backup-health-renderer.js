import { $ } from "../utils/dom.js";
import {
  formatBytes,
  getStorageRiskLevel,
} from "../services/storage-quota-service.js";
import { getMediaStorageSummary } from "../services/media-storage-strategy-service.js";
import { escapeHtml } from "../utils/dom.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getBackupHealth(memories, futureLetters, lastBackupAt) {
  const totalMemories = memories.length;
  const totalFutureLetters = futureLetters.length;
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
    totalFutureLetters,
    totalOfflinePhotos,
    estimatedStorageBytes,
    totalOnlineLinks,
    lastBackupAt,
    daysSinceBackup,
    status: getBackupStatus(daysSinceBackup),
  };
}

export function renderBackupHealth(
  memories,
  futureLetters,
  lastBackupAt,
  checklistText,
  storageEstimate,
  mediaWorkflow = {},
) {
  const health = getBackupHealth(memories, futureLetters, lastBackupAt);
  $("healthMemoryCount").textContent = health.totalMemories;
  $("healthPhotoCount").textContent = health.totalOfflinePhotos;
  $("healthStorageSize").textContent = formatBytes(health.estimatedStorageBytes);
  $("healthLetterCount").textContent = health.totalFutureLetters;
  $("healthOnlineCount").textContent = health.totalOnlineLinks;
  $("healthLastBackup").textContent = health.lastBackupAt
    ? new Date(health.lastBackupAt).toLocaleDateString("vi-VN")
    : "Chua co";
  $("healthDaysSinceBackup").textContent =
    health.daysSinceBackup === null ? "Chua co" : String(health.daysSinceBackup);
  $("healthBackupStatus").textContent = health.status.label;
  $("healthBackupStatus").className = `backupStatus ${health.status.className}`;
  $("healthChecklistText").textContent = checklistText;
  renderBrowserStorage(storageEstimate);
  renderMediaStrategy(memories, storageEstimate, mediaWorkflow);
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

function renderMediaStrategy(memories, storageEstimate, mediaWorkflow) {
  const summary = getMediaStorageSummary(memories, storageEstimate);
  $("mediaOfflinePhotoCount").textContent = summary.totalOfflinePhotos;
  $("mediaOfflinePhotoSize").textContent = formatBytes(summary.estimatedPhotoBytes);
  $("mediaDriveImageLinks").textContent = summary.totalDriveImageLinks;
  $("mediaYoutubeLinks").textContent = summary.totalYoutubeLinks;
  $("mediaDriveVideoLinks").textContent = summary.totalDriveVideoLinks;
  $("mediaMissingDrivePhotoCount").textContent =
    summary.memoriesWithOfflinePhotosMissingDrive;
  $("mediaMissingDriveVideoCount").textContent =
    summary.memoriesWithYoutubeMissingDriveVideo;
  $("mediaNoExternalCount").textContent = summary.memoriesWithoutExternalMedia;
  $("mediaBrowserUsage").textContent =
    summary.storagePercentage === null
      ? "Chua ho tro"
      : `${summary.storagePercentage.toFixed(1)}%`;
  $("mediaRiskLevel").textContent = summary.risk.label;
  $("mediaRiskLevel").className = `backupStatus ${summary.risk.className}`;
  $("mediaRecommendation").textContent = summary.risk.recommendation;
  renderMediaUploadQueue(summary.uploadQueue, mediaWorkflow.onEditMemory);
}

function renderMediaUploadQueue(queue, onEditMemory) {
  const list = $("mediaUploadQueue");
  if (!queue.length) {
    list.innerHTML =
      '<p class="mediaQueueEmpty">Khong co ky niem nao dang cho bo sung link Drive.</p>';
    return;
  }
  list.innerHTML = queue
    .map((item) => {
      const reasonText = item.reasons
        .map((reason) =>
          reason === "photo"
            ? "Anh offline chua co link Drive anh goc"
            : "YouTube chua co link Drive video goc",
        )
        .join(" • ");
      return `<article class="mediaQueueItem">
        <div><b>${escapeHtml(item.title)}</b><span>${escapeHtml(
          [item.dateCode, item.ageStage].filter(Boolean).join(" • "),
        )}</span><small>${escapeHtml(reasonText)}</small></div>
        <button class="mini mediaQueueEdit" type="button" data-memory-id="${escapeHtml(
          item.id,
        )}">Bo sung link</button>
      </article>`;
    })
    .join("");
  list.querySelectorAll(".mediaQueueEdit").forEach((button) => {
    button.onclick = () => onEditMemory?.(button.dataset.memoryId);
  });
}

function renderBrowserStorage(storageEstimate) {
  if (!storageEstimate?.supported) {
    $("browserStorageUsed").textContent = "-";
    $("browserStorageQuota").textContent = "-";
    $("browserStorageRemaining").textContent = "-";
    $("browserStoragePercent").textContent = "-";
    $("browserStorageRisk").textContent = "-";
    $("browserStorageRisk").className = "backupStatus warning";
    $("browserStorageMessage").textContent =
      "Trình duyệt này chưa hỗ trợ đo dung lượng lưu trữ.";
    return;
  }

  const risk = storageEstimate.risk || getStorageRiskLevel(storageEstimate.percentage);
  $("browserStorageUsed").textContent = formatBytes(storageEstimate.used);
  $("browserStorageQuota").textContent = formatBytes(storageEstimate.quota);
  $("browserStorageRemaining").textContent = formatBytes(storageEstimate.remaining);
  $("browserStoragePercent").textContent = `${storageEstimate.percentage.toFixed(1)}%`;
  $("browserStorageRisk").textContent = risk.label;
  $("browserStorageRisk").className = `backupStatus ${risk.className}`;
  $("browserStorageMessage").textContent =
    `${risk.message} Dung lượng trình duyệt không phải kho lưu trữ vĩnh viễn; hãy export JSON/ZIP thường xuyên.`;
}
