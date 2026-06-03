import { AGE_STAGES, DEFAULT_AGE_STAGE } from "../constants/age-stages.js";
import { ageStageLabel } from "../constants/timeline-labels.js";
import { $ } from "../utils/dom.js";

export function renderTimeline(memories, currentAge, onSelectAge, onAddAtAge) {
  const counts = Object.fromEntries(
    AGE_STAGES.map((age) => [
      age,
      memories.filter((memory) => memory.age_stage === age).length,
    ]),
  );
  $("ageList").innerHTML =
    `<button class="ageBtn ${currentAge === "all" ? "active" : ""}" data-age="all">` +
    `<div class="ageBtnRow"><button class="ageBtnMain" data-age-main="all">TAT_CA` +
    `<small>${memories.length} ky niem</small></button>` +
    `<button class="ageAddBtn" data-age-add="${DEFAULT_AGE_STAGE}">+</button></div></button>` +
    AGE_STAGES.map(
      (age) =>
        `<button class="ageBtn ${currentAge === age ? "active" : ""}" data-age="${age}">` +
        `<div class="ageBtnRow"><button class="ageBtnMain" data-age-main="${age}">${ageStageLabel(age)}` +
        `<small>${counts[age]} ky niem</small></button>` +
        `<button class="ageAddBtn" data-age-add="${age}">+</button></div></button>`,
    ).join("");

  document.querySelectorAll("[data-age-main]").forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      onSelectAge(button.dataset.ageMain);
    };
  });
  document.querySelectorAll("[data-age-add]").forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      onAddAtAge(button.dataset.ageAdd);
    };
  });
}

export function renderAgeFilter(currentAge) {
  $("ageFilter").innerHTML =
    '<option value="all">Tat ca tuoi</option>' +
    AGE_STAGES.map((age) => `<option value="${age}">${ageStageLabel(age)}</option>`).join("");
  $("ageFilter").value = currentAge;
}
