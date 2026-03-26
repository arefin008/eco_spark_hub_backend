import z from "zod";

const subscribe = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const NewsletterValidation = {
  subscribe,
};
