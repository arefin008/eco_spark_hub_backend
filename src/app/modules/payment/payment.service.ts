import { PurchaseStatus } from "../../../generated/prisma/enums";
import Stripe from "stripe";
import { envVariables } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const toStripeAmount = (amount: number) => Math.round(amount * 100);

const getStripeClient = () => {
  if (!envVariables.STRIPE.STRIPE_SECRET_KEY) {
    throw new AppError(500, "Stripe secret key is not configured");
  }

  return new Stripe(envVariables.STRIPE.STRIPE_SECRET_KEY);
};

const getBackendBaseUrl = () => {
  return envVariables.BETTER_AUTH_URL || `http://localhost:${envVariables.PORT}`;
};

const createStripeCheckoutSession = async (payload: {
  purchaseId: string;
  ideaTitle: string;
  userEmail: string;
  amount: number;
  currency: string;
}) => {
  const stripe = getStripeClient();
  const currency = payload.currency.toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: payload.userEmail,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeAmount(payload.amount),
          product_data: {
            name: `Paid Idea Access: ${payload.ideaTitle}`,
          },
        },
      },
    ],
    metadata: {
      purchaseId: payload.purchaseId,
    },
    success_url: `${getBackendBaseUrl()}/api/v1/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBackendBaseUrl()}/api/v1/payments/stripe/cancel?purchaseId=${payload.purchaseId}`,
  });

  if (!session.url) {
    throw new AppError(500, "Failed to generate Stripe checkout URL");
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};

const createCheckoutForPurchase = async (purchaseId: string, userId: string) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      idea: {
        select: {
          title: true,
          isPaid: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!purchase) throw new AppError(404, "Purchase not found");
  if (purchase.userId !== userId) throw new AppError(403, "Forbidden");
  if (purchase.status === PurchaseStatus.PAID) {
    throw new AppError(400, "This purchase is already paid");
  }
  if (!purchase.idea.isPaid) {
    throw new AppError(400, "This idea does not require payment");
  }

  const checkout = await createStripeCheckoutSession({
    purchaseId: purchase.id,
    ideaTitle: purchase.idea.title,
    userEmail: purchase.user.email,
    amount: Number(purchase.amount),
    currency: purchase.currency,
  });

  const updatedPurchase = await prisma.ideaPurchase.update({
    where: { id: purchase.id },
    data: {
      paymentProvider: "STRIPE",
      transactionId: checkout.sessionId,
      status: PurchaseStatus.PENDING,
    },
  });

  return {
    purchase: updatedPurchase,
    payment: {
      provider: "STRIPE",
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
    },
  };
};

const getPurchaseStatus = async (purchaseId: string, userId: string) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          isPaid: true,
          price: true,
        },
      },
    },
  });

  if (!purchase) throw new AppError(404, "Purchase not found");
  if (purchase.userId !== userId) throw new AppError(403, "Forbidden");

  return purchase;
};

const confirmPayment = async (purchaseId: string, transactionId: string) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) throw new AppError(404, "Purchase not found");

  if (purchase.status === PurchaseStatus.PAID) {
    return purchase;
  }

  return prisma.ideaPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.PAID,
      transactionId,
      purchasedAt: new Date(),
    },
  });
};

const markPaymentFailed = async (purchaseId: string, transactionId?: string) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) throw new AppError(404, "Purchase not found");

  if (purchase.status === PurchaseStatus.PAID) {
    return purchase;
  }

  return prisma.ideaPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.FAILED,
      transactionId: transactionId || purchase.transactionId,
    },
  });
};

const confirmStripeSession = async (sessionId: string) => {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const purchaseId = session.metadata?.purchaseId;

  if (!purchaseId) {
    throw new AppError(400, "Invalid Stripe session metadata");
  }

  if (session.payment_status === "paid") {
    const transactionId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.id;

    return confirmPayment(purchaseId, transactionId);
  }

  return markPaymentFailed(purchaseId, session.id);
};

const getPurchaseForTemplate = async (purchaseId: string) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      idea: {
        select: {
          title: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!purchase) throw new AppError(404, "Purchase not found");

  return purchase;
};

const verifyAndHandleWebhook = async (rawBody: Buffer, signature: string) => {
  if (!envVariables.STRIPE.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(500, "Stripe webhook secret is not configured");
  }

  const stripe = getStripeClient();

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    envVariables.STRIPE.STRIPE_WEBHOOK_SECRET,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchaseId;

    if (purchaseId) {
      const transactionId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.id;
      await confirmPayment(purchaseId, transactionId);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchaseId;

    if (purchaseId) {
      await markPaymentFailed(purchaseId, session.id);
    }
  }

  return event;
};

export const PaymentService = {
  createStripeCheckoutSession,
  createCheckoutForPurchase,
  getPurchaseStatus,
  confirmPayment,
  markPaymentFailed,
  confirmStripeSession,
  getPurchaseForTemplate,
  verifyAndHandleWebhook,
};
