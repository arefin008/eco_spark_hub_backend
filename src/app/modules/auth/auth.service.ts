import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const getCurrentUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const AuthService = {
  getCurrentUser,
};
