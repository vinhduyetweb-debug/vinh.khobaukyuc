export const AGE_STAGES = Array.from(
  { length: 18 },
  (_, index) =>
    `${String(index).padStart(2, "0")}_${String(index + 1).padStart(2, "0")}_TUOI`,
);

export const DEFAULT_AGE_STAGE = "06_07_TUOI";
