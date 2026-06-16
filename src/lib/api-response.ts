import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError(error.issues.map((e) => e.message).join(", "), 422);
  }
  if (error && typeof error === "object" && "name" in error && error.name === "PrismaClientInitializationError") {
    const prismaError = error as Error & { clientVersion?: string; errorCode?: string };
    console.error("Database connection failed:", {
      name: prismaError.name,
      message: prismaError.message,
      stack: prismaError.stack,
      clientVersion: prismaError.clientVersion,
      errorCode: prismaError.errorCode,
      databaseUrlSet: !!process.env.DATABASE_URL,
      databaseUrlProtocol: process.env.DATABASE_URL?.split(":")[0],
    });
    return jsonError(
      process.env.NODE_ENV === "production"
        ? "Database unavailable. Check DATABASE_URL on the server."
        : `Database error: ${error instanceof Error ? error.message : "PrismaClientInitializationError"}`,
      503
    );
  }
  console.error(error);
  return jsonError("Internal server error", 500);
}
