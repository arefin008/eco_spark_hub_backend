import { PurchaseStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { TCreatePurchasePayload } from "./purchase.interface";

const create = async (userId: string, payload: TCreatePurchasePayload) => {
  const idea = await prisma.idea.findUnique({ where: { id: payload.ideaId } });

  if (!idea) throw new AppError(404, "Idea not found");
  if (!idea.isPaid || !idea.price) {
    throw new AppError(400, "This is a free idea. Purchase not required.");
  }
  if (idea.authorId === userId) {
    throw new AppError(400, "Author does not need to purchase own idea");
  }

  return prisma.ideaPurchase.upsert({
    where: {
      ideaId_userId: {
        ideaId: payload.ideaId,
        userId,
      },
    },
    create: {
      ideaId: payload.ideaId,
      userId,
      amount: idea.price,
      paymentProvider: payload.paymentProvider,
      status: PurchaseStatus.PENDING,
    },
    update: {
      paymentProvider: payload.paymentProvider,
      status: PurchaseStatus.PENDING,
    },
  });
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
