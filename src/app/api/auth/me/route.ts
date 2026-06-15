import { NextRequest } from "next/server";
import { getAuthUser, sanitizeUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Unauthorized", 401);
    return jsonOk({ user: sanitizeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
