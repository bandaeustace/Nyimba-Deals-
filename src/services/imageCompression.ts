/**
 * Client-side High Speed Image Compressor for Nyimba Deals
 * Compresses camera captures from 3-8MB down to 60-120KB
 * Allows instant uploads on 2G/EDGE network without eating users' mobile data bundles!
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

export async function compressImage(
  fileOrBlob: File | Blob,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.76
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(fileOrBlob.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw with high quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate size of base64
        const stringLength = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687;
        const compressedSizeKb = Math.round(sizeInBytes / 1024);

        const reductionPercentage = originalSizeKb > 0
          ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
          : 0;

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeKb,
          compressedSizeKb,
          reductionPercentage,
          width,
          height,
        });
      };

      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}
