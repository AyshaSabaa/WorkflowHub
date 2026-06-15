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
  console.error(error);
  return jsonError("Internal server error", 500);
}
