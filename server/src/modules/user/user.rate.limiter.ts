import { makeLimiter } from "../../middlewares/rate.limiter";


export const userLimiter = makeLimiter("rl_user", 100, 60);