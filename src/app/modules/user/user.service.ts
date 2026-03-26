import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { TUpdateUserPayload } from "./user.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import type { Prisma } from "../../../generated/prisma/client";

const getAll = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<
    Prisma.UserWhereInput,
    Prisma.UserOrderByWithRelationInput
  >(
    query as Record<string, string | string[] | undefined>,
    {},
    { createdAt: "desc" },
  )
    .search(["name", "email"])
    .filter(["role", "status"])
    .sort("createdAt", "desc")
    .paginate(20, 100);

  const { where, orderBy, skip, limit, page } = queryBuilder.build();
  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
  ]);

  return { meta: { page, limit, total }, data };
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
