"use client";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { formContext } from "@/components/layouts/formTabView";
import { Input } from "@/components/primitives/input";
import { Button } from "@/components/primitives/button";
import { getAdminMembers } from "@/app/portal/admin/actions";
import {
  FORM_LINKS,
  FormLinkKey,
  FormLinks,
  REQUIRED_AT_LAUNCH,
  getFormLinks,
  getInterviewEmailSettings,
} from "@/lib/utils/forms/emailVariables";
import { updateFormLinkSettings } from "./actions";
import SettingsSection from "./settingsSection";

type Admin = { id: string; email: string | null; display_name: string | null };

const Tag = ({ name }: { name: string }) => (
  <code className="text-lp-400">{`{{${name}}}`}</code>
);

export default function FormLinksSection() {
  const { rawForm: form } = useContext(formContext);
  const [links, setLinks] = useState<FormLinks>(getFormLinks(form?.config));
  const [bookingLinks, setBookingLinks] = useState<Record<string, string>>(
    getInterviewEmailSettings(form?.config).bookingLinks ?? {},
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
    const trimmed = (record: Record<string, string | undefined>) =>
      Object.fromEntries(
        Object.entries(record).map(([key, value]) => [key, (value ?? "").trim()]),
      );
    const result = await updateFormLinkSettings(form.id, {
      links: trimmed(links),
      bookingLinks: trimmed(bookingLinks),
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Links saved", {
        action: { label: "Refresh", onClick: () => window.location.reload() },
      });
    } else {
      toast.error(result.error);
    }
  }

  return (
    <SettingsSection
      title="Form links"
      description="Links that change every term. Set them for each new form; duplicating a form clears them so last term's links never carry over."
      action={
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {(Object.keys(FORM_LINKS) as FormLinkKey[]).map((key) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {FORM_LINKS[key]}
              <Tag name={key} />
              {REQUIRED_AT_LAUNCH.includes(key) && (
                <span className="text-xs font-normal text-amber-300">
                  required to launch
                </span>
              )}
            </span>
            <Input
              type="url"
              placeholder="https://..."
              value={links[key] ?? ""}
              onChange={(e) =>
                setLinks((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <span className="text-sm font-medium">
          Interviewer booking links <Tag name="bookingLink" />
        </span>
        <p className="text-sm text-neutral-400">
          Interview emails use the booking link of the applicant&apos;s
          assigned interviewer (<Tag name="interviewerName" /> is their name).
          Sending a <code className="text-lp-400">to_interview</code> email
          moves the applicant to{" "}
          <code className="text-lp-400">emailed_for_interview</code>.
        </p>
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
