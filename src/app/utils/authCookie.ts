import { envVariables } from "../config/env";

const shouldUseSecureCookies =
  envVariables.BETTER_AUTH_URL.startsWith("https://") ||
  envVariables.NODE_ENV === "production";

const sameSite =
  envVariables.NODE_ENV === "production"
    ? ("none" as const)
    : ("lax" as const);

export const authCookieSettings = {
  shouldUseSecureCookies,
  sameSite,
};
