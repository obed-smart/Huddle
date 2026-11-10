import { makeLimiter } from "../../middlewares/rate.limiter";

export const mediaLimiter = makeLimiter("rl_media", 100, 60);

export const presignLimiter = makeLimiter("rl_presign", 20, 60);
