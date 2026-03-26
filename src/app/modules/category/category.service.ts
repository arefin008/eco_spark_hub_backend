import { TCreateCategoryPayload, TUpdateCategoryPayload } from "./category.interface";
import { prisma } from "../../lib/prisma";

const create = async (payload: TCreateCategoryPayload) => {
  return prisma.category.create({ data: payload });
};

const getAll = async () => {
  return prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
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
