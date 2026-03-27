# All Route Files

## .\src\app\modules\admin\admin.route.ts

```ts
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
```

## .\src\app\modules\auth\auth.route.ts

```ts
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
```

## .\src\app\modules\category\category.route.ts

```ts
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
```

## .\src\app\modules\comment\comment.route.ts

```ts
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CommentController } from "./comment.controller";
import { CommentValidation } from "./comment.validation";

const router = Router();

router.get("/idea/:ideaId", CommentController.listByIdea);
router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(CommentValidation.create),
  CommentController.create,
);
router.delete("/:id", checkAuth("MEMBER", "ADMIN"), CommentController.remove);

export const CommentRoutes = router;
```

## .\src\app\modules\idea\idea.route.ts

```ts
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { IdeaController } from "./idea.controller";
import { IdeaValidation } from "./idea.validation";

const router = Router();

router.get("/", IdeaController.getAll);
router.get("/mine", checkAuth("MEMBER", "ADMIN"), IdeaController.getMine);
router.get("/:id", IdeaController.getById);
router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(IdeaValidation.create),
  IdeaController.create,
);
router.patch(
  "/:id",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(IdeaValidation.update),
  IdeaController.update,
);
router.delete("/:id", checkAuth("MEMBER", "ADMIN"), IdeaController.remove);
router.patch(
  "/:id/submit",
  checkAuth("MEMBER", "ADMIN"),
  IdeaController.submitForReview,
);
router.patch(
  "/:id/review",
  checkAuth("ADMIN"),
  validateRequest(IdeaValidation.review),
  IdeaController.review,
);

export const IdeaRoutes = router;
```

## .\src\app\modules\newsletter\newsletter.route.ts

```ts
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { NewsletterController } from "./newsletter.controller";
import { NewsletterValidation } from "./newsletter.validation";

const router = Router();

router.post(
  "/subscribe",
  validateRequest(NewsletterValidation.subscribe),
  NewsletterController.subscribe,
);
router.patch("/unsubscribe/:email", NewsletterController.unsubscribe);
router.get("/", checkAuth("ADMIN"), NewsletterController.getAll);

export const NewsletterRoutes = router;
```

## .\src\app\modules\payment\payment.route.ts

```ts
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post(
  "/confirm",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(PaymentValidation.confirm),
  PaymentController.confirm,
);
router.get("/stripe/success", PaymentController.stripeSuccess);
router.get("/stripe/cancel", PaymentController.stripeCancel);
router.post(
  "/:purchaseId/checkout",
  checkAuth("MEMBER", "ADMIN"),
  PaymentController.createCheckout,
);
router.get(
  "/:purchaseId/status",
  checkAuth("MEMBER", "ADMIN"),
  PaymentController.statusById,
);
router.post("/webhook", PaymentController.webhook);

export const PaymentRoutes = router;
```

## .\src\app\modules\purchase\purchase.route.ts

```ts
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PurchaseController } from "./purchase.controller";
import { PurchaseValidation } from "./purchase.validation";

const router = Router();

router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(PurchaseValidation.create),
  PurchaseController.create,
);
router.get("/me", checkAuth("MEMBER", "ADMIN"), PurchaseController.getMine);

export const PurchaseRoutes = router;
```

## .\src\app\modules\user\user.route.ts

```ts
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
```

## .\src\app\modules\vote\vote.route.ts

```ts
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { VoteController } from "./vote.controller";
import { VoteValidation } from "./vote.validation";

const router = Router();

router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(VoteValidation.upsert),
  VoteController.upsert,
);
router.delete(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(VoteValidation.remove),
  VoteController.remove,
);

export const VoteRoutes = router;
```

