import { NextRequest } from "next/server";
import { getAuthUser, getTokenFromRequest } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

/** Sync httpOnly session cookie from Bearer token (e.g. after localStorage restore). */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonError("Unauthorized", 401);

    const token = getTokenFromRequest(req);
    if (!token) return jsonError("Unauthorized", 401);

    const response = jsonOk({ success: true });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
