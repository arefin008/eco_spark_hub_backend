export type TAuthSessionUser = {
  id: string;
  email: string;
  role: "MEMBER" | "ADMIN";
};

export type TRegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type TLoginPayload = {
  email: string;
  password: string;
};

export type TRefreshTokenPayload = {
  refreshToken?: string;
};

export type TChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type TVerifyEmailPayload = {
  email: string;
  otp: string;
};

export type TForgotPasswordPayload = {
  email: string;
};

export type TResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};
