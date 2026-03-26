export type TUpdateUserPayload = {
  name?: string;
  image?: string;
  role?: "MEMBER" | "ADMIN";
  status?: "ACTIVE" | "DEACTIVATED";
};
