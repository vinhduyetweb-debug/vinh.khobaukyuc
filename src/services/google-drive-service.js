export function extractFolderId(url) {
  const value = String(url || "");
  let match = value.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  match = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

export async function listPublicFolder(apiKey, folderUrl) {
  const id = extractFolderId(folderUrl);
  if (!apiKey || !id) throw new Error("Can nhap API Key va link folder Drive");

  const query = encodeURIComponent(`'${id}' in parents and trashed=false`);
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${query}` +
    `&key=${encodeURIComponent(apiKey)}` +
    "&fields=files(id,name,mimeType,webViewLink,thumbnailLink)";
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Drive API loi");
  return data.files || [];
}

export function openUrl(url, missingMessage) {
  if (!url) throw new Error(missingMessage || "Chua co link Google Drive trong Cai dat");
  window.open(url, "_blank");
}
