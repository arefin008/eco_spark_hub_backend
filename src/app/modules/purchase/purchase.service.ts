import { PurchaseStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { PaymentService } from "../payment/payment.service";
import { TCreatePurchasePayload } from "./purchase.interface";

const create = async (
  user: { id: string; email: string },
  payload: TCreatePurchasePayload,
) => {
  const idea = await prisma.idea.findUnique({ where: { id: payload.ideaId } });

  if (!idea) throw new AppError(404, "Idea not found");
  if (!idea.isPaid || !idea.price) {
    throw new AppError(400, "This is a free idea. Purchase not required.");
  }
  if (idea.authorId === user.id) {
    throw new AppError(400, "Author does not need to purchase own idea");
  }

  const existingPurchase = await prisma.ideaPurchase.findUnique({
    where: {
      ideaId_userId: {
        ideaId: payload.ideaId,
        userId: user.id,
      },
    },
  });

  if (existingPurchase?.status === PurchaseStatus.PAID) {
    throw new AppError(400, "You already purchased this idea");
  }

  const paymentProvider = payload.paymentProvider || "STRIPE";

  const purchase = existingPurchase
    ? await prisma.ideaPurchase.update({
        where: { id: existingPurchase.id },
        data: {
          paymentProvider,
          amount: idea.price,
          currency: existingPurchase.currency || "BDT",
          status: PurchaseStatus.PENDING,
          transactionId: null,
          purchasedAt: null,
        },
      })
    : await prisma.ideaPurchase.create({
        data: {
          ideaId: payload.ideaId,
          userId: user.id,
          amount: idea.price,
          paymentProvider,
          status: PurchaseStatus.PENDING,
        },
      });

  const checkout = await PaymentService.createStripeCheckoutSession({
    purchaseId: purchase.id,
    ideaTitle: idea.title,
    userEmail: user.email,
    amount: Number(idea.price),
    currency: purchase.currency,
  });

  const purchaseWithSession = await prisma.ideaPurchase.update({
    where: { id: purchase.id },
    data: {
      transactionId: checkout.sessionId,
      status: PurchaseStatus.PENDING,
    },
  });

  return {
    purchase: purchaseWithSession,
    payment: {
      provider: "STRIPE",
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
    },
  };
};

const getMine = async (userId: string) => {
  return prisma.ideaPurchase.findMany({
    where: { userId },
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const PurchaseService = {
  create,
  getMine,
};
