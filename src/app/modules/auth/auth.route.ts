import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.register),
  AuthController.register,
);
router.post("/login", validateRequest(AuthValidation.login), AuthController.login);
router.post("/google", AuthController.googleSignInUrl);
router.get("/google", AuthController.googleSignIn);
router.get("/google/url", AuthController.googleSignInUrl);
router.get("/google/callback", AuthController.googleCallback);
router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshToken),
  AuthController.refreshToken,
);
router.get("/me", checkAuth("MEMBER", "ADMIN"), AuthController.me);
router.post(
  "/change-password",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(AuthValidation.changePassword),
  AuthController.changePassword,
);
router.post("/logout", checkAuth("MEMBER", "ADMIN"), AuthController.logout);
router.post(
  "/verify-email",
  validateRequest(AuthValidation.verifyEmail),
  AuthController.verifyEmail,
);
router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPassword),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPassword),
  AuthController.resetPassword,
);

export const AuthRoutes = router;
