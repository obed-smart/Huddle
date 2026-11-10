import { makeLimiter } from "../../middlewares/rate.limiter";


export const callLimiter = makeLimiter("rl_call", 120, 60);
