import { Router } from "express";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { mediaController } from "./media.modules";
import { getUrlSchema, presignRequestSchema } from "./media.validation";
import { rateLimit, userKey } from "../../middlewares/rate.limiter";
import { mediaLimiter, presignLimiter } from "./media.rate.limiter";

const router = Router();

router.use(authenticate);
router.use(rateLimit(mediaLimiter, userKey, { failOpen: true }));

router.post(
  "/presigned",
  rateLimit(presignLimiter, userKey, { failOpen: false }),
  validate(presignRequestSchema),
  mediaController.getPresignedUrl,
);

router.get(
  "/:id/url",
  validate(getUrlSchema, "params"),
  mediaController.getMessageAttachmentUrl,
);

export default router;
