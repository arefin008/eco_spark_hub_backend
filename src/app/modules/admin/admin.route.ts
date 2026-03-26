import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.get("/stats", checkAuth("ADMIN"), AdminController.getStats);
router.patch(
  "/users/:id/status",
  checkAuth("ADMIN"),
  validateRequest(AdminValidation.updateUserStatus),
  AdminController.updateUserStatus,
);

export const AdminRoutes = router;
