import z from "zod";

const upsert = z.object({
  body: z.object({
    ideaId: z.string().min(1),
    type: z.enum(["UPVOTE", "DOWNVOTE"]),
  }),
});

const remove = z.object({
  body: z.object({
    ideaId: z.string().min(1),
  }),
});

export const VoteValidation = {
  upsert,
  remove,
};
