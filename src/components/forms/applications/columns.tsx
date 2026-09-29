import { ColumnDef, Row } from "@tanstack/react-table";
import { useContext, useEffect, useRef, useState } from "react";
import MultiSelect from "@/components/general/multiSelect";
import {
  getBookingLinkPrompt,
  saveBookingLink,
  sendStatusEmailToUser,
  updateSubmissionField,
} from "@/app/portal/admin/actions";
import { toast } from "sonner";
import FloatingTextArea from "@/components/primitives/floatingTextArea";
import { Button } from "@/components/primitives/button";
import { formContext } from "@/components/layouts/formTabView";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  MailIcon,
  Maximize2Icon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { previewStatusEmail } from "@/app/portal/admin/actions";

export type FormFields = {
  [key: string]: {
    id: string | undefined;
    type:
      | "number"
      | "select"
      | "email"
      | "text"
      | "date"
      | "textarea"
      | "checkbox"
      | "url"
      | "person";
    meta?: any;
    label: string;
    options?: { label: string; id: string }[];
    cell?: (row: any) => string;
    config?: {
      tableName: string;
      allowUpdate: boolean;
    };
    enableColumnFilter?: boolean;
    filterFn?: (
      row: Row<any>,
      columnId: string,
      filterValue: any,
      addMeta: (meta: any) => void,
    ) => boolean;
  };
};

export type ReferenceItem = {
  id: string;
  label: string;
};

export type ReferenceMap = {
  [key: string]: ReferenceItem | ReferenceMap | string;
};

export const STATUS_COLORS: Record<string, string> = {
  accepted: "bg-green-600/50",
  rejected: "bg-red-600/50",
  declined: "bg-neutral-600/60",
  pending: "bg-yellow-600/50",
  submitted: "bg-blue-600/50",
  offered: "bg-purple-600/50",
  waitlisted: "bg-orange-600/50",
  interviewed: "bg-cyan-600/50",
  paid: "bg-teal-600/50",
};

// Column widths by field type, sized for the compact table cells
const COLUMN_WIDTHS: Partial<Record<FormFields[string]["type"], number>> = {
  checkbox: 110,
  number: 110,
  date: 150,
  person: 170,
  select: 180,
  text: 200,
  email: 240,
  url: 240,
  textarea: 300,
};

export function populateReferenceMap(
  fields: FormFields,
  others: { id: string; label: string; options: any[] }[],
) {
  const referenceMap: ReferenceMap = {};
  Object.entries(fields).forEach(([key, field]) => {
    if (field.type === "person") {
      referenceMap[key] = "members";
    }
    if (field.type === "select") {
      if (!field.options) {
        return;
      }

      referenceMap[key] = field.options?.reduce((acc: ReferenceMap, option) => {
        acc[option.id] = option;
        return acc;
      }, {});
    }
  });
  others.forEach((other) => {
    const ref: ReferenceMap = {};
    other.options.forEach((option) => {
      ref[option.id] = option;
    });
    referenceMap[other.id] = ref;
  });

  return referenceMap;
}

export function createColumns<TData>(
  fields: FormFields,
  members: { id: string; email: string; display_name: string | undefined }[],
  setAndOpen: any,
): ColumnDef<keyof FormFields>[] {
  const general: any[] = Object.entries(fields)
    .filter(([, field]) => field.type !== "info")
    .map(([key, field]) => {
      return {
        meta: {
          field: field,
          id: key,
          // Dropdown cells anchor their menu inside the cell, so the table must
          // not clip them with a scroll container
          scrollOverflow: field.type !== "select" && field.type !== "person",
        },
        accessorKey: key as keyof TData,
        size: COLUMN_WIDTHS[field.type] ?? 220,
        header: (body: any) => {
          if (!body) {
            return <span>{field.label}</span>;
          }
          const column = body.column;
          const sorted = column.getIsSorted();
          return (
            <Button
              title={field.label}
              className={
                "flex h-fit min-h-none w-full items-center justify-start gap-1 bg-transparent p-0 text-left text-xs font-medium text-inherit hover:bg-transparent hover:text-white"
              }
              onClick={() => column.toggleSorting(sorted === "asc")}
            >
              <span className="truncate">{field.label}</span>
              {sorted === "asc" && <ArrowUpIcon className="h-3 w-3 shrink-0" />}
              {sorted === "desc" && (
                <ArrowDownIcon className="h-3 w-3 shrink-0" />
              )}
            </Button>
          );
        },
        enableColumnFilter:
          field.type !== "textarea" &&
          field.type !== "url" &&
          field.type !== "text" &&
          field.type !== "date" &&
          field.type !== "checkbox",
        filterFn: (
          row: Row<any>,
          columnId: string,
          filterValue: any,
          addMeta: (meta: any) => void,
        ) => {
          if (!filterValue) {
            return true;
          }

          if (filterValue === "__unassigned__") {
            const v = row.original[key];
            return !v || v === "unassigned" || v === "";
          }

          if (field.type === "select") {
            const cellValue = row.original[key];
            if (cellValue === null || cellValue === undefined) {
              return false;
            }
            const wanted = filterValue.toString().toLowerCase();
            // No options means no dropdown: populateReferenceMap skips this field,
            // so ColumnFilterInput renders a free-text box and partial input has to
            // match. Option-backed selects come from the dropdown and match
            // exactly, so "review" does not also match "reviewed".
            if (!field.options) {
              return cellValue.toString().toLowerCase().includes(wanted);
            }

            // Exact match: substring matching made "review" also match "reviewed".
            const cellValues = (
              Array.isArray(cellValue) ? cellValue : [cellValue]
            ).map((v: any) => v?.toString().toLowerCase());
            return cellValues.includes(wanted);
          }

          if (!row.original[key]) {
            return false;
          }

          return row.original[key]
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        },
        cell: ({ row }: { row: any }) => {
          if (Object.hasOwn(field, "cell")) {
            const cellResolver = field.cell as (row: any) => string;
            return cellResolver({ row });
          } else {
            const value = row.getValue(key);
            if (field.type === "textarea") {
              return (
                <TextareaField
                  field={field}
                  value={value?.toString()}
                  submissionId={row.original.id}
                  id={key}
                />
              );
            }

            if (field.type === "person") {
              const submissionId = row.original.id;
              const memberOptions = members.map((member) => ({
                ...member,
                label: member.display_name || member.email,
              }));
              return (
                <div>
                  <SelectField
                    options={memberOptions}
                    field={field}
                    value={value?.toString()}
                    submissionId={submissionId}
                    id={key}
                  />
                </div>
              );
            }

            if (field.type === "select") {
              const submissionId = row.original.id;
              return (
                <SelectField
                  options={field.options}
                  field={field}
                  value={value?.toString()}
                  submissionId={submissionId}
                  id={key}
                />
              );
            }

            if (!value) {
              return <span className={"text-gray-400"}>N/A</span>;
            }
            if (field.type === "date") {
              const date = new Date(row.original[key]);
              return date.toDateString();
            }
            if (field.type === "email") {
              return (
                <a
                  href={`mailto:${value.toString()}`}
                  className={"text-lp-200 underline"}
                >
                  {value.toString()}
                </a>
              );
            }
            if (field.type === "url") {
              const isSafe = value.toString().startsWith("https://");
              return (
                <span>
                  {!isSafe && (
                    <span className={"text-red-300"}>(Caution) </span>
                  )}
                  <a
                    href={
                      isSafe ? value.toString() : `https://${value.toString()}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className={`text-lp-200 underline`}
                  >
                    {value.toString()}
                  </a>
                </span>
              );
            }
            return row.getValue(key);
          }
        },
      };
    });
  return [
    {
      accessorKey: "popover",
      header: () => <span className="sr-only">Actions</span>,
      enableColumnFilter: false,
      meta: { scrollOverflow: false },
      // Fits the button group plus the duplicate flag slot
      size: 168,
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 shrink-0 overflow-hidden rounded-md border border-background-400">
              <button
                type="button"
                onClick={() => {
                  setAndOpen({ applicant: row });
                }}
                aria-label="Open application"
                title="Open application"
                className={
                  "inline-flex w-7 items-center justify-center text-neutral-300 transition-colors hover:bg-background-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lp-400"
                }
              >
                <Maximize2Icon className="h-3 w-3" />
              </button>
              <NotifyButtonForEmail row={row} />
            </div>
            {(row.original as any).__duplicate && (
              <span
                role="img"
                aria-label="Possible duplicate"
                title="Possible duplicate: shares an email or GitHub username with another application"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-amber-400/40 bg-amber-400/10 text-amber-300"
              >
                <AlertTriangleIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        );
      },
    },
    ...general,
  ];
}

function NotifyButtonForEmail({ row }: { row: any }) {
  const [state, setState] = useState<
    | "idle"
    | "booking"
    | "preview"
    | "loading"
    | "sending"
    | "sent"
    | "error"
    | "notemplate"
  >("idle");
  // Emails using {{bookingLink}} first ask for the assigned interviewer's
  // link, prefilled with the one they used last.
  const [booking, setBooking] = useState<{
    interviewerName: string;
    link: string;
  } | null>(null);
  const [savingLink, setSavingLink] = useState(false);
  const [preview, setPreview] = useState<{
    subject: string;
    html: string;
  } | null>(null);
  // Why the email can't be previewed/sent (e.g. missing booking link).
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState<string | null>(null);

  useEffect(() => {
    if (state === "sent" || state === "error") {
      const timer = setTimeout(() => {
        setState("idle");
      }, 8000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [state]);

  function openPreview() {
    setState("loading");
    setErrorMessage(null);
    getBookingLinkPrompt(row.original.id, row.original.status)
      .then((prompt) => {
        if ("error" in prompt) {
          setErrorMessage(prompt.error);
          setState("error");
        } else if (prompt.needed) {
          setBooking({
            interviewerName: prompt.interviewerName,
            link: prompt.link,
          });
          setState("booking");
        } else {
          loadPreview();
        }
      })
      .catch(() => setState("error"));
  }

  async function confirmBookingLink() {
    if (!booking) return;
    setSavingLink(true);
    const saved = await saveBookingLink(row.original.id, booking.link);
    setSavingLink(false);
    if (!saved.ok) {
      toast.error(saved.error);
      return;
    }
    setState("loading");
    loadPreview();
  }

  function loadPreview() {
    previewStatusEmail(row.original.id, row.original.status)
      .then((p) => {
        if (!p) {
          setState("notemplate");
        } else if ("error" in p) {
          setErrorMessage(p.error);
          setState("error");
        } else {
          setPreview(p);
          setState("preview");
        }
      })
      .catch(() => setState("error"));
  }

  function send() {
    setState("sending");
    setErrorMessage(null);
    sendStatusEmailToUser(row.original.id, row.original.status)
      .then((result) => {
        if (result.ok) {
          setSentNote(
            result.newStatus
              ? `Sent. Status moved to "${result.newStatus}" (refresh to see it).`
              : "Sent.",
          );
          setState("sent");
        } else {
          setErrorMessage(result.error);
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }

  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        aria-busy={state === "loading"}
        title="Email the applicant about their current status"
        className={
          "inline-flex items-center gap-1.5 whitespace-nowrap border-l border-background-400 px-2.5 text-xs text-neutral-300 transition-colors hover:bg-background-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lp-400 disabled:opacity-55"
        }
      >
        {state === "loading" ? (
          <LoaderCircleIcon className={"h-3 w-3 animate-spin"} />
        ) : (
          <MailIcon className={"h-3 w-3"} />
        )}
        {row.original.notified_on ? "Resend" : "Notify"}
      </button>
      {state === "booking" && booking && (
        <div
          className={
            "fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
          }
          onClick={() => setState("idle")}
        >
          <div
            className={
              "bg-background-800 border border-background-600 rounded-lg p-4 max-w-lg w-full flex flex-col gap-3"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                Booking link for{" "}
                <span className="text-lp-300">{booking.interviewerName}</span>
              </h3>
              <button
                onClick={() => setState("idle")}
                className="rounded p-1 hover:bg-background-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-neutral-400">
              {booking.link
                ? "Using the link saved last time. Keep it or paste a new one."
                : "Paste the interviewer's booking link (Calendly, Google appointment page, ...). It's saved for next time."}
            </p>
            <input
              type="url"
              autoFocus
              value={booking.link}
              onChange={(e) =>
                setBooking({ ...booking, link: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmBookingLink();
              }}
              placeholder="https://..."
              className="w-full rounded-md border border-background-500 bg-background-700 p-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="bg-background-600"
                onClick={() => setState("idle")}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBookingLink}
                disabled={savingLink || !booking.link.trim()}
              >
                {savingLink && (
                  <LoaderCircleIcon className="w-4 h-4 mr-2 animate-spin" />
                )}
                Continue to preview
              </Button>
            </div>
          </div>
        </div>
      )}
      {(state === "preview" || state === "sending") && preview && (
        <div
          className={
            "fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
          }
          onClick={() => setState("idle")}
        >
          <div
            className={
              "bg-background-800 border border-background-600 rounded-lg p-4 max-w-3xl w-full max-h-[90dvh] overflow-auto flex flex-col gap-3"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                Email preview —{" "}
                <span className="text-lp-300">{preview.subject}</span>
              </h3>
              <button
                onClick={() => setState("idle")}
                className="rounded p-1 hover:bg-background-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <iframe
              srcDoc={preview.html}
              sandbox=""
              title="Email preview"
              className="w-full h-[55dvh] bg-white rounded border border-background-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="bg-background-600"
                onClick={() => setState("idle")}
              >
                Cancel
              </Button>
              <Button
                onClick={send}
                disabled={state === "sending"}
                className="gap-2"
              >
                {state === "sending" ? (
                  <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                Send to {row.original.email}
              </Button>
            </div>
          </div>
        </div>
      )}
      {state === "notemplate" && (
        <div className="fixed bottom-4 right-4 z-40 bg-background-700 border border-yellow-600 rounded-lg p-3 text-sm max-w-xs">
          No email template is configured for the current status
          {row.original.status ? ` ("${row.original.status}")` : ""}.
        </div>
      )}
      {state === "error" && (
        <div className="fixed bottom-4 right-4 z-40 bg-background-700 border border-red-600 rounded-lg p-3 text-sm max-w-xs">
          {errorMessage ?? "Failed to load/send the email — try again."}
        </div>
      )}
      {state === "sent" && sentNote && (
        <div className="fixed bottom-4 right-4 z-40 bg-background-700 border border-lp-500 rounded-lg p-3 text-sm max-w-xs">
          {sentNote}
        </div>
      )}
    </>
  );
}

function FieldPopover({
  value,
}: {
  value: string;
  field: FormFields[keyof FormFields];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={"flex relative flex-col gap-2"}>
      <button
        className={`text-left  ${isOpen ? "" : "line-clamp-2"}  text-xs cursor-ns-resize
         `}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {value}{" "}
      </button>
    </div>
  );
}

export function SelectField({
  submissionId,
  value,
  field,
  id,
  options,
}: {
  submissionId: string;
  value: string;
  id: string;
  options: { label: string; id: string }[] | undefined;
  field: FormFields[keyof FormFields];
}) {
  const nullLabel = field.options?.find((op) => op.id === null)?.label;
  const fOptions = field.options || [];
  const overrideOptions = options || [];
  const optionsMap = new Map();

  fOptions.forEach((option) => {
    if (option.id === null) {
      return;
    }
    optionsMap.set(option.id, option);
  });

  overrideOptions.forEach((option) => {
    if (option.id === null) {
      return;
    }
    optionsMap.set(option.id, option);
  });

  const selectOptions = Array.from(optionsMap.values());
  const [selected, setSelected] = useState(value);
  const canUpdate = field.config?.allowUpdate;
  const { mergeNewData } = useContext(formContext);
  if (!canUpdate) {
    return (
      <span className={"flex flex-wrap gap-1"}>
        {value &&
          value
            .toString()
            .split(",")
            .map((option: any) => (
              <span
                key={option}
                className={"rounded bg-background-500 px-2 py-0.5"}
              >
                {option}
              </span>
            ))}
      </span>
    );
  }

  const updateField = async (val: any) => {
    const prev = selected;
    const setVal = val === undefined || val === null || val === "" ? null : val;
    setSelected(setVal);
    updateSubmissionField(submissionId, id, field.config?.tableName, setVal)
      .then(() => {
        mergeNewData({ [id]: setVal }, "id", submissionId);
        toast.success("Field updated successfully");
      })
      .catch(() => {
        setSelected(prev);
        toast.error("Error updating field");
      });
  };

  // Status keeps its color as a tinted chip; "unassigned" reads as empty text
  // so the assigned values stand out in the column.
  const selectedKey = selected?.toString().toLowerCase();
  const chipClassName =
    id === "status" && selectedKey
      ? (STATUS_COLORS[selectedKey] ??
        "bg-[color-mix(in_srgb,var(--lp-500)_45%,transparent)]")
      : selectedKey === "unassigned"
        ? "bg-transparent px-0 text-neutral-400"
        : "bg-background-500 text-neutral-100";

  // The dropdown's options and backdrop render inside the row, so their clicks
  // must not reach the row handler that opens the applicant popover.
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <MultiSelect
        compact
        className={
          "w-full border-none bg-transparent transition-shadow hover:ring-1 hover:ring-inset hover:ring-background-400"
        }
        chipClassName={chipClassName}
        onChange={(e) => updateField(e[0])}
        allowMultiple={false}
        emptyText={nullLabel?.toString() || "None"}
        value={Array.isArray(selected) ? selected : [selected]}
        options={
          selectOptions?.map((op) => ({
            label: op.label,
            value: op.id,
          })) || []
        }
      ></MultiSelect>
    </div>
  );
}

function TextareaField({
  submissionId,
  value,
  field,
  id,
}: {
  submissionId: string;
  value: string;
  id: string;
  field: FormFields[keyof FormFields];
}) {
  const [text, setText] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mergeNewData } = useContext(formContext);
  const canUpdate = field.config?.allowUpdate;
  if (!canUpdate) {
    if (value?.toString().length > 10) {
      return <FieldPopover field={field} value={value.toString()} />;
    }
    return <span>{value}</span>;
  }
  const updateField = (val: string) => {
    const setVal = val === undefined || val === null || val === "" ? null : val;
    setText(setVal);
    // Debounce: one server call per typing pause instead of per keystroke
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateSubmissionField(submissionId, id, field.config?.tableName, setVal)
        .then(() => {
          mergeNewData({ [id]: setVal }, "id", submissionId);
        })
        .catch(() => {
          toast.error("Error saving changes — retry after editing again");
        });
    }, 800);
  };
  return (
    <FloatingTextArea
      className={
        "w-full bg-transparent border-none  hover:bg-lp-500 duration-300"
      }
      value={text}
      onChange={(e) => updateField(e)}
    />
  );
}
