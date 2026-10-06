import { Router } from "express";
import { meetController } from "./meet.modules";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { createMeetSchema } from "./meet.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createMeetSchema), meetController.createMeet);

router.get("/active", meetController.getActiveMeetsForUsers);

export default router;
