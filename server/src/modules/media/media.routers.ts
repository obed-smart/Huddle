import { Router } from "express";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { mediaController } from "./media.modules";
import { getUrlSchema, presignRequestSchema } from "./media.validation";

const router = Router();

router.use(authenticate);

router.post(
  "/presigned",
  validate(presignRequestSchema),
  mediaController.getPresignedUrl,
);

router.get(
  "/:id/url",
  validate(getUrlSchema, "params"),
  mediaController.getMessageAttachmentUrl,
);

export default router;
