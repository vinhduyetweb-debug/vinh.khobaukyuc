import { AGE_STAGES, DEFAULT_AGE_STAGE } from "../constants/age-stages.js";
import { EMOTIONS, EVENT_TYPES } from "../constants/event-types.js";
import { ROOT_FOLDER } from "../constants/app.js";
import { $, escapeHtml } from "../utils/dom.js";
import { todayIso, yymmddFromDate } from "../utils/date.js";
import { suggestedFileNames } from "../utils/filename.js";

let editorMode = "quick";

export function initializeEditor() {
  $("ageInput").innerHTML = AGE_STAGES.map(
    (age) => `<option value="${age}">${age}</option>`,
  ).join("");
  $("eventInput").innerHTML = EVENT_TYPES.map(
    (eventType) => `<option value="${eventType}">${eventType}</option>`,
  ).join("");
  $("emotionInput").innerHTML = EMOTIONS.map(
    (emotion) => `<option value="${emotion}">${emotion}</option>`,
  ).join("");
}

export function openEditor(memory = null, presetAge = null, mode = "quick") {
  $("editorTitle").textContent = memory ? "Sua ky niem" : "Them ky niem";
  $("deleteMemoryBtn").style.display = memory ? "inline-block" : "none";
  $("dateInput").value = memory?.date_iso || todayIso();
  $("dateCodeInput").value =
    memory?.date_code || yymmddFromDate($("dateInput").value);
  $("ageInput").value = memory?.age_stage || presetAge || DEFAULT_AGE_STAGE;
  $("eventInput").value = memory?.event_type || "KHAC";
  $("titleInput").value = memory?.title || "";
  $("emotionInput").value = memory?.emotion || "vui";
  $("tagsInput").value = (memory?.tags || []).join(", ");
  $("noteInput").value = memory?.note || "";
  $("parentNoteInput").value = memory?.parentNote || "";
  $("childQuoteInput").value = memory?.childQuote || "";
  $("locationInput").value = memory?.location || "";
  $("peopleInput").value = (memory?.people || []).join(", ");
  $("driveImageInput").value = memory?.drive_image_folder || "";
  $("youtubeInput").value = memory?.youtube_link || "";
  $("driveVideoInput").value = memory?.drive_video_link || "";
  $("photoInput").value = "";
  setEditorMode(memory ? "full" : mode);
  updateEditorHints();
  $("editor").classList.add("open");
}

export function closeEditor() {
  $("editor").classList.remove("open");
}

export function updateEditorHints() {
  const age = $("ageInput").value || DEFAULT_AGE_STAGE;
  const eventType = $("eventInput").value || "KHAC";
  const dateCode =
    $("dateCodeInput").value || yymmddFromDate($("dateInput").value) || "260509";
  const titleOrEvent = $("titleInput").value || eventType || "ky-niem";
  const filenames = suggestedFileNames(
    dateCode,
    titleOrEvent,
    $("photoInput").files,
  );
  $("folderHintText").textContent = filenames
    .map((filename) => suggestedDrivePath(age, filename))
    .join("\n");

  let box = document.getElementById("fileSuggestBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "fileSuggestBox";
    box.className = "fileSuggest";
    $("folderHintText").parentElement.appendChild(box);
  }
  box.innerHTML = `<b>Suggested Filename:</b><pre>${escapeHtml(
    filenames.join("\n"),
  )}</pre>`;
}

export function readEditorValues() {
  const dateIso = $("dateInput").value;
  const dateCode = ($("dateCodeInput").value || yymmddFromDate(dateIso)).trim();
  const ageStage = inferAgeStage(dateIso, $("ageInput").value || DEFAULT_AGE_STAGE);
  return {
    mode: editorMode,
    dateIso,
    dateCode,
    ageStage,
    eventType: $("eventInput").value,
    title: $("titleInput").value.trim() || "Ky niem",
    emotion: $("emotionInput").value,
    tagsText: $("tagsInput").value,
    note: $("noteInput").value.trim(),
    parentNote: $("parentNoteInput").value.trim(),
    childQuote: $("childQuoteInput").value.trim(),
    location: $("locationInput").value.trim(),
    peopleText: $("peopleInput").value,
    files: Array.from($("photoInput").files || []),
    driveImageFolder: $("driveImageInput").value.trim(),
    youtubeLink: $("youtubeInput").value.trim(),
    driveVideoLink: $("driveVideoInput").value.trim(),
  };
}

export function setEditorMode(mode) {
  editorMode = mode === "full" ? "full" : "quick";
  $("editorForm").classList.toggle("quickMode", editorMode === "quick");
  $("editorForm").classList.toggle("fullMode", editorMode === "full");
  $("quickModeBtn").classList.toggle("active", editorMode === "quick");
  $("fullModeBtn").classList.toggle("active", editorMode === "full");
}

export function getEditorMode() {
  return editorMode;
}

function inferAgeStage(dateIso, fallbackAgeStage) {
  const birthDate = getConfiguredBirthDate();
  if (!birthDate || !dateIso) return fallbackAgeStage || DEFAULT_AGE_STAGE;
  const birth = new Date(`${birthDate}T00:00:00`);
  const memoryDate = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(memoryDate.getTime())) {
    return fallbackAgeStage || DEFAULT_AGE_STAGE;
  }
  let age = memoryDate.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    memoryDate.getMonth() < birth.getMonth() ||
    (memoryDate.getMonth() === birth.getMonth() &&
      memoryDate.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  if (age < 0 || age > 17) return fallbackAgeStage || DEFAULT_AGE_STAGE;
  return `${String(age).padStart(2, "0")}_${String(age + 1).padStart(2, "0")}_TUOI`;
}

function getConfiguredBirthDate() {
  try {
    const settings = JSON.parse(localStorage.getItem("khobaukyuc_settings") || "{}");
    return settings.childBirthDate || settings.birthDate || "";
  } catch {
    return "";
  }
}

function suggestedDrivePath(age, filename) {
  if (filename.includes("_VID_")) {
    return `${ROOT_FOLDER}/${age}/VIDEO_YOUTUBE/${filename}`;
  }
  if (filename.includes("_IMG_")) {
    return `${ROOT_FOLDER}/${age}/ANH_GOC_GOOGLEDRIVE/${filename}`;
  }
  return `${ROOT_FOLDER}/${age}/GHICHU/${filename}`;
}
