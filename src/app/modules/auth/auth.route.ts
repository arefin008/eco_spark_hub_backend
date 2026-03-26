import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";

const router = Router();

router.get("/me", checkAuth("MEMBER", "ADMIN"), AuthController.me);

export const AuthRoutes = router;
