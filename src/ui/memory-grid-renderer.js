import { ageStageLabel } from "../constants/timeline-labels.js";
import { $, escapeHtml } from "../utils/dom.js";

export function renderMemoryGrid(memories, currentAge, handlers) {
  $("contentTitle").textContent =
    currentAge === "all" ? "Tat ca ky niem" : ageStageLabel(currentAge);
  if (!memories.length) {
    $("memoryGrid").innerHTML =
      '<div class="note">Chua co ky niem nao. Bam “Them ky niem” de bat dau.</div>';
    return;
  }

  $("memoryGrid").innerHTML = memories
    .map((memory) => {
      const image = memory.photos?.[0]?.dataUrl;
      const tags = (memory.tags || []).slice(0, 3);
      return `<article class="card"><div class="thumb">${
        image ? `<img src="${image}">` : "💖"
      }<button class="fav" data-id="${memory.id}">${
        memory.favorite ? "❤️" : "🤍"
      }</button></div><div class="cardBody"><h4>${escapeHtml(
        memory.title || "Ky niem",
      )}</h4><p class="cardDate">${memory.date_code || ""}</p><p class="cardAge">${ageStageLabel(
        memory.age_stage,
      )}</p><p>${escapeHtml((memory.note || "").slice(0, 90))}</p><div class="meta">` +
        `<span>${memory.favorite ? "Yeu thich" : "Ky uc"}</span><span>${
          memory.emotion || "vui"
        }</span>${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}${memory.youtube_link ? "<span>YouTube</span>" : ""}${
          memory.drive_image_folder ? "<span>Drive</span>" : ""
        }</div><div class="cardActions"><button class="mini view" data-id="${
          memory.id
        }">Xem</button><button class="mini edit" data-id="${
          memory.id
        }">Sua</button><button class="mini noteExport" data-id="${
          memory.id
        }">Xuat TXT</button></div></div></article>`;
    })
    .join("");

  document
    .querySelectorAll(".view")
    .forEach((button) => (button.onclick = () => handlers.onView(button.dataset.id)));
  document
    .querySelectorAll(".edit")
    .forEach((button) => (button.onclick = () => handlers.onEdit(button.dataset.id)));
  document
    .querySelectorAll(".fav")
    .forEach(
      (button) => (button.onclick = () => handlers.onFavorite(button.dataset.id)),
    );
  document
    .querySelectorAll(".noteExport")
    .forEach(
      (button) => (button.onclick = () => handlers.onExportTxt(button.dataset.id)),
    );
}

export function renderStats(memories) {
  $("memoryCount").textContent = memories.length;
  $("photoCount").textContent = memories.reduce(
    (sum, memory) => sum + (memory.photos?.length || 0),
    0,
  );
  $("onlineCount").textContent = memories.reduce(
    (sum, memory) =>
      sum +
      (memory.youtube_link ? 1 : 0) +
      (memory.drive_image_folder ? 1 : 0) +
      (memory.drive_video_link ? 1 : 0),
    0,
  );
  const bytes = memories.reduce(
    (sum, memory) =>
      sum +
      (memory.photos || []).reduce(
        (photoSum, photo) => photoSum + (photo.size || 0),
        0,
      ),
    0,
  );
  $("storageSize").textContent = formatBytes(bytes);
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
