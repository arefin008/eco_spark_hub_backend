import z from "zod";

const updateUserStatus = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "DEACTIVATED"]),
  }),
});

export const AdminValidation = {
  updateUserStatus,
};
