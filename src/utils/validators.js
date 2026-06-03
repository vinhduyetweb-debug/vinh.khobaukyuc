export function isValidDateCode(value) {
  return /^\d{6}$/.test(String(value || ""));
}

export function isBackupData(value) {
  return Boolean(value && Array.isArray(value.memories));
}
