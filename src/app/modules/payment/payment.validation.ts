import z from "zod";

const confirm = z.object({
  body: z.object({
    purchaseId: z.string().min(1),
    transactionId: z.string().min(3),
  }),
});

export const PaymentValidation = {
  confirm,
};
