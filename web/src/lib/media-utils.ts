// Image constants
const MAX_IMAGE_DIMENSION = 1920;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const INITIAL_QUALITY = 0.85;
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.4;

// Video constants
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
];
const VIDEO_THUMBNAIL_TIME = 0.5; // seconds into video to capture
const THUMBNAIL_MAX_WIDTH = 640;

// HEIC detection
function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

// Convert HEIC to JPEG blob
async function convertHeicToJpeg(file: File): Promise<Blob> {
  // Dynamic import so the 200KB library is only loaded when needed
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  // heic2any can return a single Blob or an array
  return Array.isArray(result) ? result[0] : result;
}

// Load an image element from a blob
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(blob);
  });
}

// Resize & compress an image to WebP (or JPEG fallback)
async function compressImage(
  img: HTMLImageElement,
  fileName: string,
): Promise<File> {
  let { width, height } = img;

  // Downscale if needed
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const ratio = Math.min(
      MAX_IMAGE_DIMENSION / width,
      MAX_IMAGE_DIMENSION / height,
    );
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fallback to JPEG
  const formats: Array<{ mime: string; ext: string }> = [
    { mime: "image/webp", ext: "webp" },
    { mime: "image/jpeg", ext: "jpg" },
  ];

  for (const format of formats) {
    let quality = INITIAL_QUALITY;
    while (quality >= MIN_QUALITY) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format.mime, quality),
      );
      if (blob && blob.size <= MAX_IMAGE_SIZE_BYTES) {
        const baseName = fileName.replace(/\.[^.]+$/, "");
        return new File([blob], `${baseName}.${format.ext}`, {
          type: format.mime,
        });
      }
      quality -= QUALITY_STEP;
    }
  }

  // Last resort: return whatever JPEG we can make at min quality
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", MIN_QUALITY),
  );
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return new File([blob!], `${baseName}.jpg`, { type: "image/jpeg" });
}

// Public: process an image file
export async function processImage(file: File): Promise<File> {
  let source: Blob = file;

  // Convert HEIC first
  if (isHeic(file)) {
    source = await convertHeicToJpeg(file);
  }

  const img = await loadImage(source);
  return compressImage(img, file.name);
}

// Public: validate a video file (no transcoding)─
export interface VideoValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
}

export async function validateVideo(
  file: File,
): Promise<VideoValidationResult> {
  // Check type
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported video format. Please use MP4, WebM, or MOV.`,
    };
  }

  // Check size
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const sizeMB = Math.round(file.size / 1024 / 1024);
    return {
      valid: false,
      error: `Video is too large (${sizeMB}MB). Maximum size is 50MB.`,
    };
  }

  // Check duration
  const duration = await getVideoDuration(file);
  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Video is too long (${Math.round(duration)}s). Maximum duration is 2 minutes.`,
    };
  }

  return { valid: true, duration };
}

// Get video duration─
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read video metadata"));
    };
    video.src = url;
  });
}

// Public: generate a thumbnail from a video file─
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Seek to the thumbnail timestamp
      video.currentTime = Math.min(VIDEO_THUMBNAIL_TIME, video.duration);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(
          THUMBNAIL_MAX_WIDTH / video.videoWidth,
          1,
        );
        canvas.width = Math.round(video.videoWidth * ratio);
        canvas.height = Math.round(video.videoHeight * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to generate video thumbnail"));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video for thumbnail"));
    };

    video.src = url;
  });
}

// Public: process a file (image or video)
export interface ProcessedFile {
  file: File;
  type: "image" | "video" | "pdf";
  thumbnail?: string; // data URL for video thumbnails
  duration?: number; // video duration in seconds
}

export async function processFile(file: File): Promise<ProcessedFile> {
  if (file.type.startsWith("image/") || isHeic(file)) {
    const processed = await processImage(file);
    return { file: processed, type: "image" };
  }

  if (file.type.startsWith("video/")) {
    const validation = await validateVideo(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let thumbnail: string | undefined;
    try {
      thumbnail = await generateVideoThumbnail(file);
    } catch {
      // Thumbnail generation is best-effort
    }

    return {
      file,
      type: "video",
      thumbnail,
      duration: validation.duration,
    };
  }

  if (file.type === "application/pdf") {
    // PDF max size check (16MB)
    if (file.size > 16 * 1024 * 1024) {
      throw new Error("PDF is too large. Maximum size is 16MB.");
    }
    return { file, type: "pdf" };
  }

  throw new Error("Unsupported file type. Please upload an image, video, or PDF.");
}
