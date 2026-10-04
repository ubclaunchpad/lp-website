import { db } from "@/db";
import { requireUser } from "@/lib/utils/auth";
import { getInstagramDirectory } from "@/lib/utils/instagramDirectory";
import GenericGreeter from "@/components/layouts/genericGreeter";
import InstagramForm from "./instagramForm";
import InstagramDirectory from "./instagramDirectory";

export const dynamic = "force-dynamic";

export default async function InstagramPage() {
  const user = await requireUser();
  const saved = await db.instagram_handles.findUnique({
    where: { user_id: user.id },
  });
  // Give-to-get: the directory unlocks once you've shared your own handle.
  // Only names and handles leave the server; emails stay admin-only.
  const directory = saved
    ? (await getInstagramDirectory()).map((e) => ({
        name: e.name,
        username: e.username,
        isYou: e.userId === user.id,
      }))
    : null;

  return (
    // Normal page flow: the default centred, fixed-height box clips the top of
    // the form once the directory makes the content taller than the screen.
    <GenericGreeter spaceBg="scene" includeStyle={false}>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4">
        <InstagramForm initial={saved?.username ?? null} />
        {directory && <InstagramDirectory people={directory} />}
      </div>
    </GenericGreeter>
  );
}
