import { $, escapeHtml } from "../utils/dom.js";

export function openViewer(memory) {
  if (!memory) return;
  $("viewerTitle").textContent = memory.title;
  const media = (memory.photos || [])
    .map((photo) => `<img src="${photo.dataUrl}">`)
    .join("");
  const youtube = memory.youtube_embed
    ? `<div class="youtubeBox"><iframe src="${memory.youtube_embed}" allowfullscreen></iframe></div>`
    : "";
  $("viewerBody").innerHTML =
    `<h2>${escapeHtml(memory.title)}</h2><p><b>${memory.date_code}</b> • ${
      memory.age_stage
    } • ${memory.event_type} • ${memory.emotion}</p>` +
    `<p>${escapeHtml(memory.note)}</p><div class="meta">${(memory.tags || [])
      .map((tag) => `<span>${tag}</span>`)
      .join("")}</div>` +
    `${memory.location ? `<p><b>Dia diem:</b> ${escapeHtml(memory.location)}</p>` : ""}` +
    `${(memory.people || []).length ? `<p><b>Nguoi tham gia:</b> ${escapeHtml(memory.people.join(", "))}</p>` : ""}` +
    `${memory.parentNote ? `<p><b>Ghi chu cua bo me:</b> ${escapeHtml(memory.parentNote)}</p>` : ""}` +
    `${memory.childQuote ? `<p><b>Cau noi cua con:</b> ${escapeHtml(memory.childQuote)}</p>` : ""}` +
    `${youtube}<div class="viewerMedia">${media}</div>` +
    `${
      memory.drive_image_folder
        ? `<p><a href="${memory.drive_image_folder}" target="_blank">Mo thu muc anh Google Drive</a></p>`
        : ""
    }${
      memory.drive_video_link
        ? `<p><a href="${memory.drive_video_link}" target="_blank">Mo video Google Drive</a></p>`
        : ""
    }`;
  $("viewer").classList.add("open");
}

export function closeViewer() {
  $("viewer").classList.remove("open");
}
