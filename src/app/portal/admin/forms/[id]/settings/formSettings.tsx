"use client";
import { useState, useMemo } from "react";
import { marked } from "marked";
import Input from "@/components/general/input";
import { formContext } from "@/components/layouts/formTabView";
import { Textarea } from "@/components/primitives/textArea";
import { useContext } from "react";
import { Button } from "@/components/primitives/button";
import MultiSelect from "@/components/general/multiSelect";
import { FormStep } from "@/lib/types/questions";
import { updateOrCreateEmailTemplate } from "./actions";
import { toast } from "sonner";
import { Dialog } from "@/components/primitives/dialog";
import SettingsSection from "./settingsSection";
import { EMAIL_VARIABLES } from "@/lib/utils/forms/emailVariables";

// Helper function to extract template tags
const extractTemplateTags = (content: string): string[] => {
  const regex = /{{([^{}]+)}}/g;
  const matches = content.match(regex);
  if (!matches) return [];
  return matches.map((match) => match.slice(2, -2));
};

// Helper to find unclosed tags
const findInvalidTags = (content: string): string[] => {
  const regex = /{{([^{}]*$)|{{([^{}]*)}(?!})/g;
  const matches = content.match(regex);
  return matches || [];
};

export default function FormSettingsPage() {
  const { rawForm: form, submissions } = useContext(formContext);
  const emailStatuses = form?.config.application?.emails?.status || {};
  const statusOptions = form?.config.application?.status || [];
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openTemplates, setOpenTemplates] = useState<string[]>([]);

  async function applyTemplateChange(templateData: {
    status: string;
    title: string;
    content: string;
  }) {
    try {
      await updateOrCreateEmailTemplate(form.id, templateData.status, {
        title: templateData.title,
        content: templateData.content,
      });
      toast.success("Template updated successfully", {
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
      return true;
    } catch (error) {
      toast.error("Error updating template");
      console.error("Error updating template:", error);
      return false;
    }
  }

  const templateFields = useMemo(() => {
    const fields: Record<string, string> = {};
    form.questions.forEach((fStep: FormStep) => {
      fStep.questions.forEach((question) => {
        fields[question.id] = question.label;
      });
    });
    form.config.application?.subfields?.forEach(
      (field: { id: string; label: string }) => {
        fields[field.id] = field.label;
      },
    );
    // Filled at send time from Interview emails settings, not from answers.
    Object.assign(fields, EMAIL_VARIABLES);
    return fields;
  }, [form]);

  const handleSave = async (templateData) => {
    await applyTemplateChange(templateData);
    setEditingStatus(null);
  };

  const handleCreateNew = async (templateData) => {
    await applyTemplateChange(templateData);
    setShowNewTemplate(false);
    setSelectedStatus("");
    setTitle("");
    setContent("");
  };

  const availableStatuses = statusOptions
    .filter(
      (status) =>
        !emailStatuses[status.id] || !emailStatuses[status.id.toString()],
    )
    .map((status) => ({
      id: status.id,
      label: status.label,
    }));

  return (
    <SettingsSection
      title="Email templates"
      description="Sent to applicants when their status changes. Our email provider allows up to 100 automated emails per day, so plan bulk notifications accordingly."
      action={
        availableStatuses.length > 0 &&
        !showNewTemplate && (
          <Button size="sm" onClick={() => setShowNewTemplate(true)}>
            New template
          </Button>
        )
      }
    >
      <details className="group rounded-lg border border-background-500 bg-background-700">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-neutral-200">
          Available template tags
        </summary>
        <div className="flex flex-wrap gap-2 border-t border-background-500 p-4">
          {Object.entries(templateFields).map(([key, value]) => (
            <span
              key={key}
              className="flex items-center gap-1 rounded-md bg-background-600 px-2 py-1 text-sm"
            >
              <span className="font-mono text-lp-500">{`{{${key}}}`}</span>
              <span className="text-xs text-neutral-400">: {value}</span>
            </span>
          ))}
        </div>
      </details>

      {showNewTemplate && (
        <div className="flex flex-col gap-4 rounded-lg border border-background-500 bg-background-700 p-4">
          <h3 className="font-medium text-neutral-100">New template</h3>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md bg-background-600 p-2"
            >
              <option value="">Select a status...</option>
              {availableStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Subject line</span>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter email subject"
              className="w-full rounded-md border bg-background-600 p-2"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Email content</span>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter email content"
              rows={8}
              className="w-full resize-none rounded-md border bg-background-600 p-2 font-mono text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowNewTemplate(false);
                setSelectedStatus("");
                setTitle("");
                setContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                handleCreateNew({
                  status: selectedStatus,
                  title,
                  content,
                })
              }
              disabled={!title || !content}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {Object.keys(emailStatuses).length === 0 ? (
        !showNewTemplate && (
          <p className="rounded-lg border border-dashed border-background-500 px-6 py-10 text-center text-sm text-neutral-400">
            No email templates yet.
          </p>
        )
      ) : (
        <MultiSelect
          options={Object.entries(emailStatuses).map(
            ([status, emailConfig]) => ({
              value: status,
              label: (
                <div className="flex items-center gap-2">
                  <span className="min-w-16 rounded-full border border-background-500 bg-lp-500 px-2 py-0.5 text-center text-xs">
                    {status}
                  </span>
                  <span className="truncate text-sm opacity-75">
                    {emailConfig.title}
                  </span>
                </div>
              ),
            }),
          )}
          value={openTemplates}
          onChange={setOpenTemplates}
          allowMultiple={true}
          className="w-full"
          emptyText="Select templates to view..."
        />
      )}

      {Object.entries(emailStatuses)
        .filter(([status]) => openTemplates.includes(status))
        .map(([status, emailConfig]) => {
          const isEditing = editingStatus === status;
          const currentContent = isEditing ? content : emailConfig.content;
          const currentTitle = isEditing ? title : emailConfig.title;
          const tags = extractTemplateTags(currentContent);
          const invalidTags = findInvalidTags(currentContent);

          return (
            <div
              key={status}
              className="flex min-w-0 flex-col gap-4 rounded-lg border border-background-500 bg-background-700 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-background-500 px-3 py-1 text-sm font-semibold capitalize">
                  {status}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewStatus(status)}
                  >
                    Preview
                  </Button>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingStatus(status);
                        setContent(emailConfig.content);
                        setTitle(emailConfig.title);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {previewStatus === status && (
                <TemplatePreview
                  template={{
                    title: currentTitle,
                    content: currentContent,
                  }}
                  onClose={() => setPreviewStatus(null)}
                  submissions={submissions}
                  templateFields={templateFields}
                />
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Subject line</span>
                <Input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isEditing}
                  className="w-full rounded-md border bg-background-600 p-2"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Email content</span>
                <Textarea
                  value={currentContent}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!isEditing}
                  className="field-sizing-content min-h-[300px] w-full rounded-md border bg-background-600 p-2 font-mono text-sm"
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  Template fields used
                </span>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-md bg-background-600 px-2 py-1 font-mono text-sm ${
                          Object.keys(templateFields).includes(tag)
                            ? "text-lp-500"
                            : "text-red-500"
                        }`}
                      >{`{{${tag}}}`}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-neutral-400">None</span>
                )}
                {invalidTags.length > 0 && (
                  <p className="text-sm text-red-500">
                    Found unclosed template tags. Please fix them before saving.
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingStatus(null);
                      setContent(emailConfig.content);
                      setTitle(emailConfig.title);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave({ status, title, content })}
                    disabled={
                      invalidTags.length > 0 ||
                      tags.some(
                        (tag) => !Object.keys(templateFields).includes(tag),
                      )
                    }
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          );
        })}
    </SettingsSection>
  );
}

function TemplatePreview({
  template,
  onClose,
  submissions,
  templateFields,
}: {
  template: { title: string; content: string };
  onClose: () => void;
  submissions: any[];
  templateFields: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const previewContent = useMemo(() => {
    if (!selectedUser) return template.content;

    let content = template.content;
    // Replace template variables
    Object.keys(templateFields).forEach((key) => {
      const value = selectedUser[key] || selectedUser.details?.[key];
      if (value) {
        content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
      }
    });

    // Convert markdown links to HTML
    return marked(content, { breaks: true });
  }, [selectedUser, template.content, templateFields]);

  // Update the preview content display to render HTML

  return (
    <Dialog open onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 bg-black/80">
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background-800 p-6 shadow-lg sm:rounded-lg">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Preview Template</h2>

            <div className="flex gap-2 items-center">
              <Input
                className="p-2 w-full bg-background-600 rounded-md"
                list="preview-emails"
                placeholder="Search user by email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <datalist id="preview-emails">
                {submissions.map((submission) => (
                  <option key={submission.id}>{submission.email}</option>
                ))}
              </datalist>
              <Button
                disabled={!search || search.length < 3}
                onClick={() => {
                  setSelectedUser(submissions.find((s) => s.email === search));
                }}
              >
                Preview
              </Button>
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="font-medium">Subject</h3>
              <div className="p-2 bg-background-600 rounded-md">
                {template.title}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Content</h3>
              <div className="p-2 bg-background-600 rounded-md whitespace-pre-wrap ">
                <div
                  className="p-2 bg-background-600 rounded-md whitespace-pre-wrap min-h-[200px] max-h-[600px] overflow-y-auto prose prose-sm prose-invert [&>*]:!my-0.5 [&_p]:!my-0.5 [&_ul]:!my-0.5 [&_li]:!my-0.5 [&_ul]:!pl-4 [&_ol]:!pl-4"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
