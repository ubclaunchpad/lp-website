import { redirect } from "next/navigation";
import { db } from "@/db";
import { getFormById } from "@/lib/utils/forms/server";
import { getSessionUser, isAdmin } from "@/lib/utils/auth";
import {
  RevealPayload,
  displayName,
  firstName,
  getTeamReveal,
  isTeamRevealOpen,
} from "@/lib/utils/forms/teamReveal";
import TeamRevealExperience from "@/components/forms/teams/teamRevealExperience";
import GenericGreeter from "@/components/layouts/genericGreeter";
import LaunchRocket from "@/components/forms/launch/launchRocket";

const MEMBER_STATUSES = ["accepted", "paid"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <GenericGreeter spaceBg="scene">
      <div className="glass-panel flex max-w-xl flex-col items-center gap-4 p-10 text-center animate-fade-up">
        <LaunchRocket firing={false} direction="up" size={64} />
        <h1 className="font-heading text-3xl font-bold text-white">{title}</h1>
        <p className="text-base text-neutral-300">{body}</p>
      </div>
    </GenericGreeter>
  );
}

export default async function TeamsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  // Admins only: preview as an applicant (application id) or as a team.
  searchParams?: { applicant?: string; team?: string };
}) {
  const formId = Number(params.id);
  const form = await getFormById(formId);
  const user = await getSessionUser();
  if (!form || !user) {
    redirect("/portal/forms");
  }
  const admin = await isAdmin(user.id);
  const applicantParam = searchParams?.applicant;
  const teamParam = Number(searchParams?.team);

  // Whose team to show: an admin-chosen applicant/team, or the viewer's own.
  let application: any = null;
  let teamId: bigint | null = null;
  let preview = false;
  if (admin && (applicantParam || teamParam)) {
    preview = true;
    if (applicantParam && UUID.test(applicantParam)) {
      application = await db.submissions.findFirst({
        where: { id: applicantParam, form_id: BigInt(formId) },
        include: { applications: true },
      });
      teamId = application?.applications?.team_id ?? null;
    } else if (teamParam) {
      teamId = BigInt(teamParam);
    }
  } else {
    application = await db.submissions.findUnique({
      where: { user_id_form_id: { user_id: user.id, form_id: BigInt(formId) } },
      include: { applications: true },
    });
    const status = application?.applications?.status;
    if (!application || !MEMBER_STATUSES.includes(status)) {
      return (
        <Notice
          title="No team to reveal"
          body="Teams are revealed to members who have accepted their offer. If you think this is a mistake, email team@ubclaunchpad.com."
        />
      );
    }
    if (!isTeamRevealOpen(form.config)) {
      return (
        <Notice
          title="Teams are still under wraps"
          body="Your team will be revealed at kickoff. Keep this page handy, and come back when we give the signal."
        />
      );
    }
    teamId = application.applications.team_id;
  }

  if (!teamId) {
    return (
      <Notice
        title="Team coming soon"
        body="You don't have a team assigned yet. We'll let you know as soon as you do."
      />
    );
  }

  const team = await db.teams.findUnique({ where: { id: teamId } });
  if (!team) {
    return <Notice title="Team not found" body="Please contact team@ubclaunchpad.com." />;
  }

  const members = await db.applications.findMany({
    where: {
      team_id: teamId,
      status: { in: MEMBER_STATUSES },
      submissions: { form_id: BigInt(formId) },
    },
    include: { submissions: true },
  });
  const youId = application?.applications?.id;
  const teammates = members
    .map((m) => {
      const details: any = m.submissions.details ?? {};
      const role = Array.isArray(details.role) ? details.role[0] : details.role;
      return {
        name: displayName(details),
        role: role === "Designer" ? "Designer" : "Developer",
        isYou: m.id === youId,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const payload: RevealPayload = {
    formTitle: form.title,
    teamName: team.name,
    reveal: getTeamReveal(team.meta),
    teammates,
    youName: application ? firstName(application.details) : "Preview",
    preview,
  };

  return <TeamRevealExperience payload={payload} />;
}
