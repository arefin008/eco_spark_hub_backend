import z from "zod";

const create = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    description: z.string().max(500).optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    description: z.string().max(500).optional(),
  }),
});

export const CategoryValidation = {
  create,
  update,
};
