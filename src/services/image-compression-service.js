export function compressImage(file, maxSize = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      let width = image.width;
      let height = image.height;
      if (Math.max(width, height) > maxSize) {
        const ratio = maxSize / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      URL.revokeObjectURL(url);
      resolve({
        name: file.name,
        type: "image/jpeg",
        dataUrl,
        size: Math.round(dataUrl.length * 0.75),
      });
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}
