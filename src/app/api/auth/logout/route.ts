import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonOk } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user) {
    await logActivity({ userId: user.id, action: "LOGOUT", message: `${user.name} logged out` });
    await createAuditLog({ userId: user.id, action: "LOGOUT", entityType: "User", entityId: user.id });
  }
  const response = jsonOk({ success: true });
  response.cookies.set("token", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
