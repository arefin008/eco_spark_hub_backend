import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

router.get("/", checkAuth("ADMIN"), UserController.getAll);
router.get("/:id", checkAuth("ADMIN"), UserController.getById);
router.patch(
  "/:id",
  checkAuth("ADMIN"),
  validateRequest(UserValidation.update),
  UserController.update,
);

export const UserRoutes = router;
