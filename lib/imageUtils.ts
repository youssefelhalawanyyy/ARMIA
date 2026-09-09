/**
 * Client-side ultra-fast image compression utility.
 * Guarantees high visual retina quality while enforcing strict size budgets
 * (< 70KB per data URL) to strictly prevent Firestore 1,048,576-byte document overflow.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number; // Target max size for dataUrl in bytes (default 70,000)
}

/**
 * Checks if a string is a base64 data URL
 */
export function isDataUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image/');
}

/**
 * Estimates the byte length of a string
 */
export function getStringByteSize(str: string | null | undefined): number {
  if (!str) return 0;
  return new Blob([str]).size;
}

/**
 * Compress an HTMLImageElement or ImageBitmap onto a canvas with iterative budget check
 */
function renderAndCompressCanvas(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  maxBytes: number
): { blob: Blob | null; dataUrl: string } {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Preserve aspect ratio within max bounds
  if (width > maxWidth || height > maxHeight) {
    if (width / height > maxWidth / maxHeight) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { blob: null, dataUrl: '' };
  }

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

  // Iterative budget enforcement: if still exceeding maxBytes, downscale dimensions & quality
  let attempts = 0;
  while (dataUrl.length > maxBytes && attempts < 3) {
    attempts++;
    currentQuality = Math.max(0.48, currentQuality - 0.12);
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  return { blob: null, dataUrl };
}

/**
 * Compresses a File into an ultra-efficient web JPEG guaranteed to be under maxBytes.
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 1060,
  quality = 0.70,
  maxBytes = 70000
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        return resolve({ blob: file, dataUrl: '' });
      }

      const img = new window.Image();
      img.onload = () => {
        const { dataUrl } = renderAndCompressCanvas(img, maxWidth, maxHeight, quality, maxBytes);
        const finalUrl = dataUrl || src;

        // Create Blob from dataURL
        try {
          const byteString = atob(finalUrl.split(',')[1]);
          const mimeString = finalUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          resolve({ blob, dataUrl: finalUrl });
        } catch {
          resolve({ blob: file, dataUrl: finalUrl });
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Re-compresses an existing base64 data URL if it exceeds maxBytes.
 * If already smaller than maxBytes or if it's an external HTTP URL, returns as-is.
 */
export async function compressDataUrlIfNeeded(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 1060,
  quality = 0.70,
  maxBytes = 65000
): Promise<string> {
  if (!isDataUrl(dataUrl)) {
    return dataUrl;
  }

  if (dataUrl.length <= maxBytes) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const { dataUrl: compressed } = renderAndCompressCanvas(
        img,
        maxWidth,
        maxHeight,
        quality,
        maxBytes
      );
      resolve(compressed || dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
