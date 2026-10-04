"use server";
import { db } from "@/db";
import { requireUser } from "@/lib/utils/auth";
import { normalizeInstagram } from "@/lib/utils/instagram";

type Result = { ok: true; username: string | null } | { ok: false; error: string };

// The account is always the signed-in user; the client never names one.
export async function saveInstagram(input: string): Promise<Result> {
  const user = await requireUser();
  const username = normalizeInstagram(input);
  if (!username) {
    return {
      ok: false,
      error: "That doesn't look like an Instagram username (letters, numbers, . and _ only).",
    };
  }
  await db.instagram_handles.upsert({
    where: { user_id: user.id },
    create: { user_id: user.id, username },
    update: { username, updated_at: new Date() },
  });
  return { ok: true, username };
}

export async function removeInstagram(): Promise<Result> {
  const user = await requireUser();
  await db.instagram_handles.deleteMany({ where: { user_id: user.id } });
  return { ok: true, username: null };
}
