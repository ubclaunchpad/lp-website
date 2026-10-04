// Server-only data helper (plain module, not "use server", so it isn't an
// invokable RPC). Callers must do their own auth checks.
import { db } from "@/db";
import { displayName } from "@/lib/utils/forms/teamReveal";

export type InstagramEntry = {
  userId: string;
  name: string;
  email: string;
  username: string;
  member: boolean;
  updated: string;
};

export async function getInstagramDirectory(): Promise<InstagramEntry[]> {
  const rows = await db.instagram_handles.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      users: {
        include: {
          members: true,
          submissions: { orderBy: { created_at: "desc" }, take: 1 },
        },
      },
    },
  });
  return rows.map((r) => {
    const m = r.users.members;
    const name = m?.first_name
      ? `${m.first_name} ${m.last_name}`.trim()
      : r.users.submissions[0]
        ? displayName(r.users.submissions[0].details)
        : "";
    return {
      userId: r.user_id,
      name: name || "Launch Pad member",
      email: r.users.email ?? "",
      username: r.username,
      member: Boolean(m),
      updated: r.updated_at.toISOString(),
    };
  });
}
