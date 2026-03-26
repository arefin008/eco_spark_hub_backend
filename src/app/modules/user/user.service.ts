import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { TUpdateUserPayload } from "./user.interface";

const getAll = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError(404, "User not found");

  return user;
};

const update = async (id: string, payload: TUpdateUserPayload) => {
  return prisma.user.update({
    where: { id },
    data: payload,
  });
};

export const UserService = {
  getAll,
  getById,
  update,
};
