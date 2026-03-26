import { TCreateCategoryPayload, TUpdateCategoryPayload } from "./category.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import type { Prisma } from "../../../generated/prisma/client";

const create = async (payload: TCreateCategoryPayload) => {
  return prisma.category.create({ data: payload });
};

const getAll = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<
    Prisma.CategoryWhereInput,
    Prisma.CategoryOrderByWithRelationInput
  >(
    query as Record<string, string | string[] | undefined>,
    {},
    { createdAt: "desc" },
  )
    .search(["name", "description"])
    .sort("createdAt", "desc")
    .paginate(20, 100);

  const { where, orderBy, skip, limit, page } = queryBuilder.build();
  const [total, data] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return { meta: { page, limit, total }, data };
};

const update = async (id: string, payload: TUpdateCategoryPayload) => {
  return prisma.category.update({
    where: { id },
    data: payload,
  });
};

const remove = async (id: string) => {
  return prisma.category.delete({ where: { id } });
};

export const CategoryService = {
  create,
  getAll,
  update,
  remove,
};
