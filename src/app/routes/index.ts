import { Router } from "express";
import { AiRoutes } from "../modules/ai/ai.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { CategoryRoutes } from "../modules/category/category.route";
import { CommentRoutes } from "../modules/comment/comment.route";
import { IdeaRoutes } from "../modules/idea/idea.route";
import { NewsletterRoutes } from "../modules/newsletter/newsletter.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { PurchaseRoutes } from "../modules/purchase/purchase.route";
import { UserRoutes } from "../modules/user/user.route";
import { VoteRoutes } from "../modules/vote/vote.route";

const router = Router();

router.use("/ai", AiRoutes);
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/admins", AdminRoutes);
router.use("/categories", CategoryRoutes);
router.use("/ideas", IdeaRoutes);
router.use("/votes", VoteRoutes);
router.use("/comments", CommentRoutes);
router.use("/purchases", PurchaseRoutes);
router.use("/payments", PaymentRoutes);
router.use("/newsletters", NewsletterRoutes);

export const IndexRoutes = router;
