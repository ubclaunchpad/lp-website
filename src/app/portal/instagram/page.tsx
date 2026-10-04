import { db } from "@/db";
import { requireUser } from "@/lib/utils/auth";
import GenericGreeter from "@/components/layouts/genericGreeter";
import InstagramForm from "./instagramForm";

export default async function InstagramPage() {
  const user = await requireUser();
  const saved = await db.instagram_handles.findUnique({
    where: { user_id: user.id },
  });
  return (
    <GenericGreeter spaceBg="scene">
      <InstagramForm initial={saved?.username ?? null} />
    </GenericGreeter>
  );
}
