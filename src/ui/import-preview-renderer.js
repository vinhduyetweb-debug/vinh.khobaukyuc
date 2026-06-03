import { $ } from "../utils/dom.js";

export function openImportPreview(preview) {
  $("importPreviewSource").textContent = preview.source.appName;
  $("importPreviewVersion").textContent = preview.source.backupVersion;
  $("importPreviewSchema").textContent = preview.source.schemaVersion;
  $("importPreviewExportedAt").textContent = preview.source.exportedAt;
  $("importPreviewManifest").textContent = preview.source.hasManifest ? "Co" : "Khong";
  $("importPreviewChecksum").textContent = preview.source.hasChecksum ? "Co" : "Khong";
  $("importPreviewMemoryCount").textContent = preview.totals.memories;
  $("importPreviewPhotoCount").textContent = preview.totals.offlinePhotos;
  $("importPreviewLetterCount").textContent = preview.totals.futureLetters;
  $("importPreviewOnlineCount").textContent = preview.totals.onlineLinks;
  $("importPreviewAddCount").textContent =
    preview.conflicts.profilesToAdd +
    preview.conflicts.memoriesToAdd +
    preview.conflicts.futureLettersToAdd;
  $("importPreviewConflictCount").textContent = preview.conflicts.totalConflicts;
  $("importPreviewWarnings").textContent = preview.warnings.length
    ? preview.warnings.join("\n")
    : "Khong co canh bao dac biet.";
  $("importPreviewConflictDetails").textContent = [
    `Profiles them moi: ${preview.conflicts.profilesToAdd}`,
    `Profiles trung ID: ${preview.conflicts.profilesToUpdate}`,
    `Ky uc them moi: ${preview.conflicts.memoriesToAdd}`,
    `Ky uc trung ID: ${preview.conflicts.memoriesToUpdate}`,
    `Thu them moi: ${preview.conflicts.futureLettersToAdd}`,
    `Thu trung ID: ${preview.conflicts.futureLettersToUpdate}`,
  ].join("\n");
  $("importPreview").classList.add("open");
}

export function closeImportPreview() {
  $("importPreview").classList.remove("open");
}

export function readImportStrategy() {
  return (
    document.querySelector('input[name="importStrategy"]:checked')?.value ||
    "skipExisting"
  );
}

export function bindImportPreviewActions({ onCancel, onConfirm }) {
  $("cancelImportPreviewBtn").onclick = onCancel;
  $("confirmImportPreviewBtn").onclick = onConfirm;
  $("closeImportPreviewBtn").onclick = onCancel;
  $("importPreview").onclick = (event) => {
    if (event.target.id === "importPreview") onCancel();
  };
}
