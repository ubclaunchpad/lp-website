"use client";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { formContext } from "@/components/layouts/formTabView";
import { Button } from "@/components/primitives/button";
import { isTeamRevealOpen } from "@/lib/utils/forms/teamReveal";
import { setTeamRevealOpen } from "./actions";
import SettingsSection from "./settingsSection";

export default function TeamRevealSection() {
  const { rawForm: form, submissions } = useContext(formContext);
  const [open, setOpen] = useState(isTeamRevealOpen(form?.config));
  const [saving, setSaving] = useState(false);
  const path = `/portal/forms/${form.id}/application/teams`;
  // This term's teams: team_id options that applicants are actually on
  // (the options list also carries teams copied from last term's form).
  const assigned = new Set(
    (submissions ?? []).map((s: any) => String(s.team_id ?? "")),
  );
  const teams: { id: string; label: string }[] = (
    form?.config?.application?.subfields?.find((f: any) => f.id === "team_id")
      ?.options ?? []
  ).filter((t: any) => t.id && t.id !== "null" && assigned.has(String(t.id)));

  async function toggle() {
    setSaving(true);
    const result = await setTeamRevealOpen(form.id, !open);
    setSaving(false);
    if (result.ok) {
      setOpen(!open);
      toast.success(!open ? "Teams revealed to members" : "Team reveal closed");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <SettingsSection
      title="Team reveal"
      description="An animated page where accepted and paid members discover their team. Keep it closed until you're ready (e.g. at kickoff); admins can always preview."
      action={
        <Button
          size="sm"
          onClick={toggle}
          disabled={saving}
          className={open ? "bg-background-600" : ""}
        >
          {saving ? "Saving..." : open ? "Close reveal" : "Reveal teams"}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 rounded-lg border border-background-500 bg-background-700 p-4 text-sm">
        <span>
          Status:{" "}
          <span className={open ? "font-semibold text-lp-300" : "font-semibold text-amber-300"}>
            {open ? "Open: members can see their team" : "Closed: members see \"still under wraps\""}
          </span>
        </span>
        <span className="text-neutral-400">
          Member link:{" "}
          <a href={path} target="_blank" rel="noopener noreferrer" className="text-lp-300 underline">
            ubclaunchpad.com{path}
          </a>
        </span>
        <span className="text-neutral-400">
          Preview a team:{" "}
          {teams.map((t) => (
            <a key={t.id} href={`${path}?team=${t.id}`} target="_blank" rel="noopener noreferrer" className="mr-3 text-lp-300 underline">
              {t.label}
            </a>
          ))}
        </span>
      </div>
    </SettingsSection>
  );
}
