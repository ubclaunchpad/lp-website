import { db } from "@/db";
import { requireAdmin } from "@/lib/utils/auth";
import { displayName } from "@/lib/utils/forms/teamReveal";
import { instagramUrl } from "@/lib/utils/instagram";
import InstagramExport from "./instagramExport";

export const dynamic = "force-dynamic";

export default async function AdminInstagramPage() {
  // Server-side guard: the admin layout's check is client-only.
  await requireAdmin();
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

  const handles = rows.map((r) => {
    const m = r.users.members;
    const name = m?.first_name
      ? `${m.first_name} ${m.last_name}`.trim()
      : r.users.submissions[0]
        ? displayName(r.users.submissions[0].details)
        : "";
    return {
      name: name || "—",
      email: r.users.email ?? "",
      username: r.username,
      member: Boolean(m),
      updated: r.updated_at.toISOString(),
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-20 pt-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-background-500 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-neutral-100">Instagram handles</h1>
          <p className="text-sm text-neutral-400">
            {handles.length} shared · members add theirs at{" "}
            <a href="/portal/instagram" className="text-lp-300 underline">
              ubclaunchpad.com/portal/instagram
            </a>
          </p>
        </div>
        <InstagramExport handles={handles} />
      </header>

      {handles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-background-500 px-6 py-12 text-center text-sm text-neutral-400">
          No one has shared their Instagram yet.
        </p>
      ) : (
        <ul className="divide-y divide-background-600 overflow-hidden rounded-lg border border-background-500">
          {handles.map((h) => (
            <li key={h.username} className="flex flex-wrap items-center justify-between gap-2 bg-background-700 px-4 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-neutral-100">
                  {h.name}
                  {h.member && (
                    <span className="ml-2 rounded-full bg-lp-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-lp-200">
                      member
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-neutral-400">{h.email}</span>
              </div>
              <a
                href={instagramUrl(h.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-lp-300 underline underline-offset-2"
              >
                @{h.username}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
