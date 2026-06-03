const MB = 1024 * 1024;
const GB = 1024 * MB;

export function getMediaStorageSummary(memories, storageEstimate) {
  const estimatedPhotoBytes = estimatePhotoBytes(memories);
  const storagePercentage = storageEstimate?.supported
    ? storageEstimate.percentage
    : null;
  const summary = {
    totalOfflinePhotos: countOfflinePhotos(memories),
    estimatedPhotoBytes,
    totalDriveImageLinks: countByField(memories, "drive_image_folder"),
    totalYoutubeLinks: countByField(memories, "youtube_link"),
    totalDriveVideoLinks: countByField(memories, "drive_video_link"),
    storagePercentage,
  };
  return {
    ...summary,
    risk: getMediaRiskLevel(summary),
  };
}

export function getMediaRiskLevel(summary) {
  const photoBytes = summary.estimatedPhotoBytes;
  const storage = Number(summary.storagePercentage || 0);
  if (photoBytes > GB || storage >= 90) {
    return {
      label: "Nguy cấp",
      className: "critical",
      recommendation:
        "Cần backup ngay. Không nên tiếp tục thêm nhiều ảnh trước khi sao lưu.",
    };
  }
  if (photoBytes >= 500 * MB || storage >= 75) {
    return {
      label: "Cao",
      className: "warning",
      recommendation:
        "Nên export ZIP ngay và giảm số ảnh nặng lưu offline.",
    };
  }
  if (photoBytes >= 100 * MB || storage >= 50) {
    return {
      label: "Trung bình",
      className: "watch",
      recommendation:
        "Nên bắt đầu lưu ảnh gốc ở Drive/ổ cứng và chỉ giữ ảnh nén trong app.",
    };
  }
  return {
    label: "Thấp",
    className: "safe",
    recommendation:
      "Dung lượng hiện tại còn nhẹ. Vẫn nên backup định kỳ.",
  };
}

export function mediaStorageStrategyText(exportedAt = new Date().toISOString()) {
  return [
    "KHOBAUKYUC - CHIEN LUOC LUU ANH/VIDEO DAI HAN",
    "",
    `Export date: ${exportedAt}`,
    "",
    "Anh trong app chi nen dung de xem nhanh.",
    "Anh offline trong app la anh nen/compressed preview, khong nen xem la ban goc duy nhat.",
    "Anh/video goc nen luu o Google Drive, o cung ngoai, NAS hoac thu muc backup rieng.",
    "Video nen luu bang link YouTube/Google Drive thay vi nhung truc tiep vao app.",
    "Hay export ZIP/JSON dinh ky va kiem tra file ZIP mo duoc sau khi export.",
    "",
    "Checklist:",
    "- Export ZIP moi thang.",
    "- Export JSON sau moi lan nhap nhieu ky uc.",
    "- Luu anh/video goc o it nhat 2 noi.",
    "- Khong phu thuoc duy nhat vao trinh duyet.",
    "- Khong doi ten JSON thanh ZIP thu cong.",
  ].join("\n");
}

function countOfflinePhotos(memories) {
  return memories.reduce((sum, memory) => sum + (memory.photos || []).length, 0);
}

function estimatePhotoBytes(memories) {
  return memories.reduce(
    (sum, memory) =>
      sum +
      (memory.photos || []).reduce(
        (photoSum, photo) => photoSum + (photo.size || 0),
        0,
      ),
    0,
  );
}

function countByField(memories, fieldName) {
  return memories.reduce((sum, memory) => sum + (memory[fieldName] ? 1 : 0), 0);
}
