import { IdeaStatus, PurchaseStatus, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const getStats = async () => {
  const [
    totalUsers,
    totalIdeas,
    approvedIdeas,
    rejectedIdeas,
    underReviewIdeas,
    totalComments,
    totalPaidPurchases,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { status: IdeaStatus.APPROVED } }),
    prisma.idea.count({ where: { status: IdeaStatus.REJECTED } }),
    prisma.idea.count({ where: { status: IdeaStatus.UNDER_REVIEW } }),
    prisma.ideaComment.count(),
    prisma.ideaPurchase.count({ where: { status: PurchaseStatus.PAID } }),
  ]);

  return {
    totalUsers,
    totalIdeas,
    approvedIdeas,
    rejectedIdeas,
    underReviewIdeas,
    totalComments,
    totalPaidPurchases,
  };
};

const updateUserStatus = async (id: string, status: "ACTIVE" | "DEACTIVATED") => {
  return prisma.user.update({
    where: { id },
    data: {
      status: status as UserStatus,
    },
  });
};

export const AdminService = {
  getStats,
  updateUserStatus,
};
