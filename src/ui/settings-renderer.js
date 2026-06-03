import { ROOT_FOLDER } from "../constants/app.js";
import { $ } from "../utils/dom.js";

export function openSettings(settings) {
  $("rootFolderInput").value = settings.rootFolder || ROOT_FOLDER;
  $("driveRootInput").value = settings.driveRootUrl || "";
  $("apiKeyInput").value = settings.apiKey || "";
  $("clientIdInput").value = settings.clientId || "";
  $("settings").classList.add("open");
}

export function closeSettings() {
  $("settings").classList.remove("open");
}

export function readSettingsValues() {
  return {
    rootFolder: $("rootFolderInput").value.trim(),
    driveRootUrl: $("driveRootInput").value.trim(),
    apiKey: $("apiKeyInput").value.trim(),
    clientId: $("clientIdInput").value.trim(),
  };
}
