/**
 * Optimizes Cloudinary images for web delivery
 * - Resizes to appropriate width (maintains aspect ratio)
 * - Compresses quality (still looks great)
 * - Auto-selects best format (WebP/AVIF for modern browsers)
 *
 * IMPORTANT: NO CROPPING - Original composition is preserved!
 */

export function optimizeCloudinaryImage(
  url: string | null | undefined,
  options: {
    width?: number;
    quality?: number;
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
  } = {},
): string {
  // Return original if not a valid Cloudinary URL
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return url || "";
  }

  const {
    width = 800, // Default max width for feed images
    quality = 75, // Default quality (75 is sweet spot for web)
    format = "auto", // Auto-select best format
  } = options;

  // Build transformation string
  // w_XXX = max width (height scales proportionally - NO CROP!)
  // q_XXX = quality percentage
  // f_auto = automatic format selection (WebP for modern, JPG for old browsers)
  const transformation = `w_${width},q_${quality},f_${format}`;

  // Insert transformation before /upload/
  // Example: /upload/ becomes /upload/w_800,q_75,f_auto/
  const optimized = url.replace("/upload/", `/upload/${transformation}/`);

  return optimized;
}

/**
 * Preset configurations for different image types
 */
export const ImagePresets = {
  // Feed post images - balance between quality and performance
  // Feed column is max-w-2xl (672px), displayed at ~494px
  FEED_POST: { width: 500, quality: 80 },

  // Thumbnails in feed - smaller, faster
  FEED_THUMBNAIL: { width: 500, quality: 75 },

  // Avatar images - small and crisp
  AVATAR: { width: 200, quality: 85 },

  // School logos - small and high quality
  LOGO: { width: 200, quality: 90 },

  // Full-size view - larger, better quality
  FULL_VIEW: { width: 1920, quality: 85 },

  // Mobile optimized
  MOBILE: { width: 600, quality: 75 },
} as const;
