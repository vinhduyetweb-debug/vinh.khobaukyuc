import { ageStageLabel } from "../constants/timeline-labels.js";
import { $, escapeHtml } from "../utils/dom.js";

export function renderFamilyHome(memories, handlers) {
  const recent = memories.slice(0, 3);
  if (!recent.length) {
    $("recentMemories").innerHTML = "<p>Chua co ky niem nao.</p>";
  } else {
    $("recentMemories").innerHTML = recent
      .map(
        (memory) =>
          `<button class="recentMemoryBtn" data-id="${memory.id}">` +
          `<span>${escapeHtml(memory.title || "Ky niem")}</span>` +
          `<small>${memory.date_code || ""} • ${ageStageLabel(memory.age_stage)}</small>` +
          `</button>`,
      )
      .join("");
  }
  document.querySelectorAll(".recentMemoryBtn").forEach((button) => {
    button.onclick = () => handlers.onOpenMemory(button.dataset.id);
  });
}
