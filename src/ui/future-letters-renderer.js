import { $, escapeHtml } from "../utils/dom.js";

export function renderFutureLetters(letters, handlers) {
  const list = $("futureLettersList");
  if (!letters.length) {
    list.innerHTML = '<div class="note">Chua co thu nao. Hay viet mot la thu cho My Anh trong tuong lai.</div>';
  } else {
    list.innerHTML = letters
      .map(
        (letter) =>
          `<article class="letterCard"><h4>${escapeHtml(letter.title)}</h4>` +
          `<p>${letter.targetAge ? `Tuoi ${escapeHtml(letter.targetAge)}` : "Tuong lai"}${
            letter.targetDate ? ` • ${escapeHtml(letter.targetDate)}` : ""
          }</p>` +
          `<p>${escapeHtml((letter.body || "").slice(0, 120))}</p>` +
          `<div class="cardActions"><button class="mini letterView" data-id="${letter.id}">Xem</button>` +
          `<button class="mini letterEdit" data-id="${letter.id}">Sua</button>` +
          `<button class="mini letterDelete" data-id="${letter.id}">Xoa</button></div></article>`,
      )
      .join("");
  }

  document
    .querySelectorAll(".letterView")
    .forEach((button) => (button.onclick = () => handlers.onView(button.dataset.id)));
  document
    .querySelectorAll(".letterEdit")
    .forEach((button) => (button.onclick = () => handlers.onEdit(button.dataset.id)));
  document
    .querySelectorAll(".letterDelete")
    .forEach((button) => (button.onclick = () => handlers.onDelete(button.dataset.id)));
}

export function openLetterEditor(letter = null) {
  $("letterEditorTitle").textContent = letter ? "Sua thu gui con" : "Viet thu gui con";
  $("letterIdInput").value = letter?.id || "";
  $("letterTitleInput").value = letter?.title || "";
  $("letterTargetAgeInput").value = letter?.targetAge || "";
  $("letterTargetDateInput").value = letter?.targetDate || "";
  $("letterBodyInput").value = letter?.body || "";
  $("futureLetterEditor").classList.add("open");
}

export function closeLetterEditor() {
  $("futureLetterEditor").classList.remove("open");
}

export function readLetterEditorValues() {
  return {
    id: $("letterIdInput").value,
    title: $("letterTitleInput").value.trim() || "Thu gui My Anh tuong lai",
    targetAge: $("letterTargetAgeInput").value.trim(),
    targetDate: $("letterTargetDateInput").value,
    body: $("letterBodyInput").value.trim(),
  };
}

export function openLetterViewer(letter) {
  if (!letter) return;
  $("letterViewerTitle").textContent = letter.title;
  $("letterViewerBody").innerHTML =
    `<h2>${escapeHtml(letter.title)}</h2>` +
    `<p><b>Tuoi muon gui:</b> ${escapeHtml(letter.targetAge || "")}</p>` +
    `<p><b>Ngay muon gui:</b> ${escapeHtml(letter.targetDate || "")}</p>` +
    `<div class="letterBodyText">${escapeHtml(letter.body || "").replaceAll("\n", "<br>")}</div>`;
  $("futureLetterViewer").classList.add("open");
}

export function closeLetterViewer() {
  $("futureLetterViewer").classList.remove("open");
}
