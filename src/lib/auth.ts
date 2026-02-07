import jwt from "jsonwebtoken";

type Role = "USER" | "ADMIN";
export type SessionPayload = { userId: string; role: Role; email: string };

export function signSession(payload: SessionPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET as string;
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}
