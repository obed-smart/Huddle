import { Router } from "express";
import { userController } from "./user.modules";
import authenticate from "../../middlewares/authentication.middleware";
import validate from "../../middlewares/validation.middleware";
import { searchUserSchema } from "./user.validation";

const router = Router();

router.get("/me", authenticate, userController.getMe);
router.get(
  "/search",
  authenticate,
  validate(searchUserSchema, "query"),
  userController.searchUsers,
);

router.get(
  "/:username",
  authenticate,
  validate(searchUserSchema, "params"),
  userController.getUserByUsername,
);

export default router;
