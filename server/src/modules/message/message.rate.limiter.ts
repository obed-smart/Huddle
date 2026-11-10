import { makeLimiter } from "../../middlewares/rate.limiter";


export const messageLimiter = makeLimiter("rl_message", 150, 60);

