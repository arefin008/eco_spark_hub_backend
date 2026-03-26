import z from "zod";

const update = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    image: z.string().url().optional(),
    role: z.enum(["MEMBER", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
  }),
});

export const UserValidation = {
  update,
};
