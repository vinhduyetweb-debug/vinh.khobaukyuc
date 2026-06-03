export function isValidDateCode(value) {
  return /^\d{6}$/.test(String(value || ""));
}

export function isValidDriveUrl(value) {
  return isOptionalUrlForHosts(value, ["drive.google.com"]);
}

export function isValidYoutubeUrl(value) {
  return isOptionalUrlForHosts(value, [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
  ]);
}

export function isBackupData(value) {
  return Boolean(value && Array.isArray(value.memories));
}

function isOptionalUrlForHosts(value, allowedHosts) {
  const text = String(value || "").trim();
  if (!text) return true;
  try {
    const url = new URL(text);
    return url.protocol === "https:" && allowedHosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
