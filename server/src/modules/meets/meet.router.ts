import { Router } from "express";
import { meetController } from "./meet.modules";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { createMeetSchema } from "./meet.validation";
import { meetLimiter, strictMeetLimiter } from "./meet.rate.limiter";
import { rateLimit, userKey } from "../../middlewares/rate.limiter";

const router = Router();

router.use(authenticate);
router.use(rateLimit(meetLimiter, userKey, { failOpen: true }));

router.post(
  "/",
  rateLimit(strictMeetLimiter, userKey, { failOpen: true }),
  validate(createMeetSchema),
  meetController.createMeet,
);

router.get("/active", meetController.getActiveMeetsForUsers);

export default router;
