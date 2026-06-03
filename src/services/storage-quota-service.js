export async function getBrowserStorageEstimate() {
  if (!navigator.storage?.estimate) {
    return { supported: false };
  }

  const estimate = await navigator.storage.estimate();
  const used = Number(estimate.usage || 0);
  const quota = Number(estimate.quota || 0);
  const remaining = Math.max(0, quota - used);
  const percentage = calculatePercentage(used, quota);

  return {
    supported: true,
    used,
    quota,
    remaining,
    percentage,
    risk: getStorageRiskLevel(percentage),
  };
}

export function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function calculatePercentage(used, quota) {
  if (!quota) return 0;
  return Math.min(100, Math.max(0, (used / quota) * 100));
}

export function getStorageRiskLevel(percentage) {
  if (percentage >= 90) {
    return {
      label: "Critical",
      className: "critical",
      message: "Cảnh báo dung lượng: cần export ZIP/JSON và giảm dữ liệu cục bộ.",
    };
  }
  if (percentage >= 75) {
    return {
      label: "Warning",
      className: "warning",
      message: "Cảnh báo dung lượng: nên backup sớm.",
    };
  }
  if (percentage >= 50) {
    return {
      label: "Watch",
      className: "watch",
      message: "Nên backup và theo dõi dung lượng trình duyệt.",
    };
  }
  return {
    label: "Safe",
    className: "safe",
    message: "Dung lượng hiện vẫn trong vùng an toàn.",
  };
}
