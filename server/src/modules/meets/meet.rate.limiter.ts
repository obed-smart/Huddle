import { makeLimiter } from "../../middlewares/rate.limiter";

export const meetLimiter = makeLimiter("rl_meet", 120, 60);

export const strictMeetLimiter = makeLimiter("rl_strict_meet", 10, 60);
