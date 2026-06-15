import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { User, UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as string & jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function getAuthUser(req: NextRequest): Promise<User | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getAuthUser(req);
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function sanitizeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
