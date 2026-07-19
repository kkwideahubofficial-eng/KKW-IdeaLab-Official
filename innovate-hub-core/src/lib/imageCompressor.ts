/**
 * Utility to automatically compress an image file to be under maxSizeBytes (default 3 MB)
 * and resize large dimensions if necessary before uploading.
 */
export async function compressImageToLimit(
  file: File,
  maxSizeBytes: number = 3 * 1024 * 1024
): Promise<File> {
  // If not an image or already within the maxSizeBytes limit, return original file
  if (!file.type.startsWith("image/") || file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Cap dimensions to a maximum of 1920x1080 while preserving aspect ratio
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress iteratively to fit under maxSizeBytes
        let quality = 0.85;

        const attemptCompression = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              if (blob.size <= maxSizeBytes || currentQuality <= 0.25) {
                const compressedName = file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg";
                const compressedFile = new File([blob], compressedName, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                attemptCompression(currentQuality - 0.15);
              }
            },
            "image/jpeg",
            currentQuality
          );
        };

        attemptCompression(quality);
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
