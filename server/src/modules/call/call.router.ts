import { Router } from "express";
import authenticate from "../../middlewares/authentication.middleware";
import { callController } from "./call.modules";
import { rateLimit, userKey } from "../../middlewares/rate.limiter";
import { callLimiter } from "./call.limiter";

const router = Router();

router.use(authenticate);
router.use(rateLimit(callLimiter, userKey, { failOpen: true }));

router.get("/", callController.getCallLOgs);
router.get("/active", callController.getActiveCallsForUsers);

export default router;
