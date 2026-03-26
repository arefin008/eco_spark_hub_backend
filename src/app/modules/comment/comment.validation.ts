import z from "zod";

const create = z.object({
  body: z.object({
    ideaId: z.string().min(1),
    content: z.string().min(1).max(2000),
    parentId: z.string().optional(),
  }),
});

export const CommentValidation = {
  create,
};
