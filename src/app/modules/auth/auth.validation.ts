import z from "zod";

export const AuthValidation = {
  register: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(6),
    }),
  }),
  login: z.object({
    body: z.object({
      email: z.email(),
      password: z.string().min(6),
    }),
  }),
  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().optional(),
    }),
  }),
  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(6),
      newPassword: z.string().min(6),
    }),
  }),
  verifyEmail: z.object({
    body: z.object({
      email: z.email(),
      otp: z.string().length(6),
    }),
  }),
  forgotPassword: z.object({
    body: z.object({
      email: z.email(),
    }),
  }),
  resetPassword: z.object({
    body: z.object({
      email: z.email(),
      otp: z.string().length(6),
      newPassword: z.string().min(6),
    }),
  }),
};
