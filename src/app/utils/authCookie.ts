import { envVariables } from "../config/env";

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isLoopbackHostname = (hostname: string) => {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
};

const getSiteKey = (url: URL) => {
  const hostname = url.hostname.toLowerCase();

  if (isLoopbackHostname(hostname)) {
    return `${url.protocol}//${hostname}`;
  }

  const parts = hostname.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return `${url.protocol}//${hostname}`;
  }

  return `${url.protocol}//${parts.slice(-2).join(".")}`;
};

const frontendUrl = parseUrl(envVariables.FRONTEND_URL);
const backendUrl = parseUrl(envVariables.BETTER_AUTH_URL);

const shouldUseCrossSiteCookies =
  frontendUrl && backendUrl
    ? getSiteKey(frontendUrl) !== getSiteKey(backendUrl)
    : envVariables.NODE_ENV === "production";

const shouldUseSecureCookies =
  backendUrl?.protocol === "https:" ||
  (shouldUseCrossSiteCookies && envVariables.NODE_ENV === "production");

export const authCookieSettings = {
  shouldUseCrossSiteCookies,
  shouldUseSecureCookies,
  sameSite: shouldUseCrossSiteCookies ? ("none" as const) : ("lax" as const),
};
