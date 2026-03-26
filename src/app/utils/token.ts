import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export const createToken = (
  payload: string | object | Buffer,
  secret: Secret,
  options: SignOptions,
) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};
