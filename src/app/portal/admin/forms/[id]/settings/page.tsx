"use client";
import { useContext, useState } from "react";
import FormSettingsPage from "./formSettings";
import DeleteFormSection from "./deleteFormSection";
import FormLinksSection from "./formLinksSection";
import SettingsSection from "./settingsSection";
import { formContext } from "@/components/layouts/formTabView";
import { MainResultPage } from "@/components/forms/resultPages/MainResultPage";
import MultiSelect from "@/components/general/multiSelect";
import { Input } from "@/components/primitives/input";
import { Button } from "@/components/primitives/button";
import { Application } from "@/lib/types/questions";

function ResultPagePreviews({ form }) {
  const { submissions } = useContext(formContext);
  const [search, setSearch] = useState("");
  const [app, setApp] = useState<Application | null>(null);

  const statusOptions =
    form?.config?.application?.status?.map((status) => ({
      value: status.id,
      label: (
        <div className="flex items-center gap-2">
          <span className="border text-xs border-background-500 rounded-full px-2 py-0.5 bg-lp-500 min-w-16 text-center">
            {status.id}
          </span>
          <span className="text-sm truncate opacity-75">{status.label}</span>
        </div>
      ),
    })) || [];

  const [selectedStatus, setSelectedStatus] = useState(
    statusOptions[0]?.value || "",
  );

  return (
    <SettingsSection
      title="Status portal preview"
      description="See what applicants see in their portal for each status. Optionally look up an applicant by email to preview it with their data."
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <MultiSelect
          options={statusOptions}
          value={[selectedStatus]}
          onChange={(value) => setSelectedStatus(value[0])}
          allowMultiple={false}
          className="w-full md:w-64 md:shrink-0"
          emptyText="Select status to preview..."
        />
        <div className="flex flex-1 items-center gap-2">
          <Input
            className="w-full"
            list="preview-emails"
            placeholder="Search applicant by email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <datalist id="preview-emails">
            {submissions.map((submission) => (
              <option key={submission.id}>{submission.email}</option>
            ))}
          </datalist>
          <Button
            size="sm"
            className="shrink-0"
            disabled={!app && (!search || search.length < 3)}
            onClick={() => {
              if (app) {
                setApp(null);
                setSearch("");
                return;
              }
              setApp(
                (submissions.find(
                  (s) => s.email === search,
                ) as unknown as Application) ?? null,
              );
            }}
          >
            {app ? "Clear" : "Search"}
          </Button>
        </div>
      </div>

      {selectedStatus ? (
        <div className="rounded-lg border border-background-500 bg-background-700 p-4">
          <MainResultPage
            application={app}
            status={selectedStatus}
            form={form}
            formStatus={true}
          />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-background-500 px-6 py-10 text-center text-sm text-neutral-400">
          This form has no statuses configured yet.
        </p>
      )}
    </SettingsSection>
  );
}

export default function SettingsPage() {
  const { rawForm: form } = useContext(formContext);

  return (
    <div className="dark mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 pb-20 pt-4 md:px-8">
      <FormSettingsPage />
      <FormLinksSection />
      <ResultPagePreviews form={form} />
      <DeleteFormSection />
    </div>
  );
}
