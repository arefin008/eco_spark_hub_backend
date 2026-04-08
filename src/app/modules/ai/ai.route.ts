import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AiController } from "./ai.controller";
import { AiValidation } from "./ai.validation";

const router = Router();

router.post("/assistant", validateRequest(AiValidation.assistant), AiController.assistant);
router.post("/draft", validateRequest(AiValidation.draft), AiController.draft);

export const AiRoutes = router;
