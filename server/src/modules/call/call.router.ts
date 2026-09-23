import { Router } from "express";
import authenticate from "../../middlewares/authentication.middleware";
import { callController } from "./call.modules";

const router = Router();

router.get("/", authenticate, callController.getCallLOgs);

export default router;
