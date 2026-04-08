import z from "zod";

const ideaContext = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(120),
  isPaid: z.boolean(),
  upvotes: z.number().int(),
  commentCount: z.number().int(),
  problemStatement: z.string().min(1).max(4000),
  proposedSolution: z.string().min(1).max(4000),
  description: z.string().min(1).max(8000),
});

const assistant = z.object({
  body: z.object({
    question: z.string().trim().min(1).max(1000),
    ideas: z.array(ideaContext).max(20),
  }),
});

const draft = z.object({
  body: z.object({
    title: z.string().max(160),
    categoryName: z.string().max(80).optional(),
    problemStatement: z.string().max(4000),
    proposedSolution: z.string().max(4000),
    description: z.string().max(8000),
    isPaid: z.boolean(),
  }),
});

export const AiValidation = {
  assistant,
  draft,
};
