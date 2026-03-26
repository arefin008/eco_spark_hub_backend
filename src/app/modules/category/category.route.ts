import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = Router();

router.get("/", CategoryController.getAll);
router.post(
  "/",
  checkAuth("ADMIN"),
  validateRequest(CategoryValidation.create),
  CategoryController.create,
);
router.patch(
  "/:id",
  checkAuth("ADMIN"),
  validateRequest(CategoryValidation.update),
  CategoryController.update,
);
router.delete("/:id", checkAuth("ADMIN"), CategoryController.remove);

export const CategoryRoutes = router;
