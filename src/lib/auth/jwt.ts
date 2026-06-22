import jwt from "jsonwebtoken";
import { getEnv } from "@/lib/config/env";
import type { JwtPayload } from "@/types";

export function signAccessToken(payload: JwtPayload): string {
  const { JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN } = getEnv();
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: Pick<JwtPayload, "userId">): string {
  const { JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = getEnv();
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const { JWT_ACCESS_SECRET } = getEnv();
  return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, "userId"> {
  const { JWT_REFRESH_SECRET } = getEnv();
  return jwt.verify(token, JWT_REFRESH_SECRET) as Pick<JwtPayload, "userId">;
}

export function generateEmailVerificationToken(): string {
  return jwt.sign({ purpose: "email-verify" }, getEnv().JWT_ACCESS_SECRET, {
    expiresIn: "24h",
  });
}

export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, purpose: "password-reset" }, getEnv().JWT_ACCESS_SECRET, {
    expiresIn: "1h",
  });
}

export function verifyPasswordResetToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as {
    userId: string;
    purpose: string;
  };
  if (decoded.purpose !== "password-reset") {
    throw new Error("Invalid token purpose");
  }
  return { userId: decoded.userId };
}
