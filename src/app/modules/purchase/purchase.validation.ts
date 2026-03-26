import z from "zod";

const create = z.object({
  body: z.object({
    ideaId: z.string().min(1),
    paymentProvider: z.string().min(2).max(40),
  }),
});

export const PurchaseValidation = {
  create,
};
