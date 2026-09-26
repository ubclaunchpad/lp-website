import { db } from "@/db";

// Year roles every member gets on Discord. Must match the server's role labels
// exactly; Colony silently skips names it can't find.
export const MEMBER_DISCORD_ROLES = ["2026-2027 Member", "Member"];

// The member record for a session user, with the teams that decide their
// Discord roles. Null when the user hasn't accepted an offer yet.
export function getMemberWithTeams(userId: string) {
  return db.members.findUnique({
    where: { id: userId },
    include: { team_members: { include: { teams: true } } },
  });
}

type MemberWithTeams = NonNullable<
  Awaited<ReturnType<typeof getMemberWithTeams>>
>;

// Roles are derived server-side from the member's teams so a client can't ask
// Colony for arbitrary roles (Colony can assign anything below its own role).
export function memberDiscordRoles(member: MemberWithTeams): string[] {
  const teamRoles = member.team_members.flatMap(
    (tm) => (tm.teams.meta as any)?.discord?.roles ?? [],
  );
  return Array.from(new Set([...MEMBER_DISCORD_ROLES, ...teamRoles]));
}

export function sameUsername(a: string | null | undefined, b: string) {
  return !!a && a.toLowerCase() === b.toLowerCase();
}
