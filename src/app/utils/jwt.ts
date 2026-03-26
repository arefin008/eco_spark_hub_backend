import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

type TVerifyTokenResult =
  | { success: true; data: JwtPayload }
  | { success: false; message: string };

const createToken = (
  payload: JwtPayload,
  secret: string,
  options: SignOptions,
) => {
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: string): TVerifyTokenResult => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return {
      success: true,
      data: decoded,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid token provided";

    return {
      success: false,
      message,
    };
  }
};

const decodeToken = (token: string): JwtPayload | null => {
  const decoded = jwt.decode(token);
  return decoded && typeof decoded !== "string" ? decoded : null;
};

export const jwtUtils = {
  createToken,
  verifyToken,
  decodeToken,
};
