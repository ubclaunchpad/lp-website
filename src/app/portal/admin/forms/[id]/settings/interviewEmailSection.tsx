"use client";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { formContext } from "@/components/layouts/formTabView";
import { Input } from "@/components/primitives/input";
import { Button } from "@/components/primitives/button";
import { getAdminMembers } from "@/app/portal/admin/actions";
import { getInterviewEmailSettings } from "@/lib/utils/forms/emailVariables";
import { updateInterviewEmailSettings } from "./actions";
import SettingsSection from "./settingsSection";

type Admin = { id: string; email: string | null; display_name: string | null };

export default function InterviewEmailSection() {
  const { rawForm: form } = useContext(formContext);
  const saved = getInterviewEmailSettings(form?.config);
  const [projectCatalog, setProjectCatalog] = useState(
    saved.projectCatalog ?? "",
  );
  const [bookingLinks, setBookingLinks] = useState<Record<string, string>>(
    saved.bookingLinks ?? {},
  );
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminMembers()
      .then((rows) =>
        setAdmins(
          (rows as Admin[]).sort((a, b) =>
            (a.display_name || a.email || "").localeCompare(
              b.display_name || b.email || "",
            ),
          ),
        ),
      )
      .catch(() => setAdmins([]));
  }, []);

  async function save() {
    setSaving(true);
    const result = await updateInterviewEmailSettings(form.id, {
      projectCatalog: projectCatalog.trim(),
      bookingLinks: Object.fromEntries(
        Object.entries(bookingLinks).map(([id, link]) => [id, link.trim()]),
      ),
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Interview email settings saved");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <SettingsSection
      title="Interview emails"
      description={
        <>
          Links that change each term. Use{" "}
          <code className="text-lp-400">{"{{projectCatalog}}"}</code>,{" "}
          <code className="text-lp-400">{"{{bookingLink}}"}</code> and{" "}
          <code className="text-lp-400">{"{{interviewerName}}"}</code> in the
          email template; the booking link comes from the applicant&apos;s
          assigned interviewer. Sending a{" "}
          <code className="text-lp-400">to_interview</code> email moves the
          applicant to <code className="text-lp-400">emailed_for_interview</code>.
        </>
      }
      action={
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Project catalog link</span>
        <Input
          type="url"
          placeholder="https://..."
          value={projectCatalog}
          onChange={(e) => setProjectCatalog(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Interviewer booking links</span>
        {admins === null ? (
          <p className="text-sm text-neutral-400">Loading admins...</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-neutral-400">No admins found.</p>
        ) : (
          admins.map((admin) => (
            <label
              key={admin.id}
              className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3"
            >
              <span className="text-sm text-neutral-300 md:w-48 md:shrink-0 md:truncate">
                {admin.display_name || admin.email}
              </span>
              <Input
                type="url"
                placeholder="https://calendar.app.google/... or Calendly link"
                value={bookingLinks[admin.id] ?? ""}
                onChange={(e) =>
                  setBookingLinks((prev) => ({
                    ...prev,
                    [admin.id]: e.target.value,
                  }))
                }
              />
            </label>
          ))
        )}
      </div>
    </SettingsSection>
  );
}
