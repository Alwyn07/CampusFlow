import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth-options";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, error: null };
}
