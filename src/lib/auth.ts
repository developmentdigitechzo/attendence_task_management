import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "digitechzo-secure-session-auth-token-key-2026";
const secret = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "MANAGER" | "EMPLOYEE";
  employeeId: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function signSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      department: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRoles: ("SUPER_ADMIN" | "MANAGER" | "EMPLOYEE")[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as any)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
