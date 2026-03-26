import { PurchaseStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const confirmPayment = async (purchaseId: string, transactionId: string) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) throw new AppError(404, "Purchase not found");

  return prisma.ideaPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.PAID,
      transactionId,
      purchasedAt: new Date(),
    },
  });
};

export const PaymentService = {
  confirmPayment,
};
