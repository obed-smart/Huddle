export const MEDIA_POLICY = {
  voice: {
    maxBytes: 16 * 1024 * 1024,
    mimes: ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"],
  },

  image: {
    maxBytes: 10 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
  video: {
    maxBytes: 100 * 1024 * 1024,
    mimes: ["video/mp4", "video/quicktime", "video/webm"],
  },
  file: { maxBytes: 25 * 1024 * 1024, mimes: ["application/pdf"] },
} as const;
