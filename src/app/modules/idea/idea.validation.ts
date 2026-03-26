import z from "zod";

const create = z.object({
  body: z.object({
    title: z.string().min(3).max(180),
    problemStatement: z.string().min(10),
    proposedSolution: z.string().min(10),
    description: z.string().min(10),
    categoryId: z.string().min(1),
    isPaid: z.boolean().optional(),
    price: z.number().nonnegative().optional(),
    mediaUrls: z.array(z.url()).optional(),
  }),
});

const update = z.object({
  body: z.object({
    title: z.string().min(3).max(180).optional(),
    problemStatement: z.string().min(10).optional(),
    proposedSolution: z.string().min(10).optional(),
    description: z.string().min(10).optional(),
    categoryId: z.string().min(1).optional(),
    isPaid: z.boolean().optional(),
    price: z.number().nonnegative().optional(),
    mediaUrls: z.array(z.url()).optional(),
  }),
});

const review = z.object({
  body: z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().min(3).max(500).optional(),
  }),
});

export const IdeaValidation = {
  create,
  update,
  review,
};
