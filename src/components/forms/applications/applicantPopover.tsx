import React, { useEffect, useMemo, useState } from "react";
import { FormFields } from "@/components/forms/applications/columns";
import { ColumnDef, flexRender, Row } from "@tanstack/react-table";
import { TableCell } from "@/components/primitives/table";
import { getStatusHistory } from "@/app/portal/admin/actions";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  HistoryIcon,
  XIcon,
} from "lucide-react";
import { useParams } from "next/navigation";

export default function useApplicantPopover({
  fields,
  rows,
}: {
  fields: FormFields;
  rows: Row<string | number>[];
}) {
  const [open, setOpen] = useState(false);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const formId = useParams<{ id: string }>()?.id;

  const index = useMemo(
    () =>
      applicantId ? rows.findIndex((r) => (r.original as any)?.id === applicantId) : -1,
    [applicantId, rows],
  );
  const applicant = index >= 0 ? rows[index] : null;

  function setAndOpen({ applicant }: { applicant: Row<string | number> }) {
    setApplicantId((applicant.original as any)?.id ?? null);
    setHistory(null);
    setOpen(true);
  }

  function move(delta: number) {
    if (index < 0) return;
    const next = rows[index + delta];
    if (next) {
      setApplicantId((next.original as any)?.id ?? null);
      setHistory(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "Escape") {
        setOpen(false);
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!open || !applicantId) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    getStatusHistory(applicantId)
      .then((h) => !cancelled && setHistory(h as any[]))
      .catch(() => !cancelled && setHistory([]));
    return () => {
      cancelled = true;
    };
  }, [open, applicantId]);

  const applicantPopover = useMemo(() => {
    if (!open || !applicant) return null;
    return (
      <div
        className={
          "fixed inset-0 flex-col  bg-black bg-opacity-50 flex items-end justify-end h-screen p-2 w-screen z-30"
        }
      >
        <button
          className={"absolute w-screen h-screen bg-transparent"}
          onClick={() => setOpen(false)}
        ></button>
        <div className="flex z-40 flex-col flex-shrink-0 gap-2 bg-background-800  overflow-y-scroll border border-background-700 shadow p-4 w-full min-w-0 sm:min-w-[400px] max-w-xl  flex-1 rounded-lg">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-gray-400">
              {index + 1} of {rows.length}
            </span>
            <div className="flex gap-1">
              <a
                href={`/portal/forms/${formId}/application?applicant=${applicantId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-300 hover:bg-background-600"
                title="See this applicant's portal page (read-only)"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                Portal page
              </a>
              <button
                onClick={() => move(-1)}
                disabled={index <= 0}
                className="rounded p-1 hover:bg-background-600 disabled:opacity-30"
                title="Previous applicant (k)"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(1)}
                disabled={index >= rows.length - 1}
                className="rounded p-1 hover:bg-background-600 disabled:opacity-30"
                title="Next applicant (j)"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-background-600"
                title="Close (esc)"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {applicant.getVisibleCells().map((cell) => (
            <div
              key={cell.id}
              className={
                "w-full border-b border-b-background-500 flex-shrink-0  flex  flex-col gap-2  pb-4 pl-0  text-xs  left-0  "
              }
            >
              {fields[cell.column.id] && (
                <div className={"flex gap-2"}>
                  <span className={"font-semibold"}>
                    {fields[cell.column.id].label}
                  </span>
                </div>
              )}
              <div className={"flex gap-2 "}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <span
              className={"font-semibold text-xs flex items-center gap-2"}
            >
              <HistoryIcon className="h-3 w-3" />
              Status history
            </span>
            {history === null && (
              <span className="text-gray-400 text-xs">Loading…</span>
            )}
            {history?.length === 0 && (
              <span className="text-gray-400 text-xs">
                No status changes recorded
              </span>
            )}
            {history?.map((h) => (
              <div
                key={h.id}
                className="text-xs flex justify-between gap-2 border-b border-background-500 pb-1"
              >
                <span>
                  {h.old_status ? h.old_status : "—"} →{" "}
                  <b>{h.new_status ?? "—"}</b>
                </span>
                <span className="text-gray-400 text-right">
                  {h.users?.email || "system"}
                  <br />
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, [applicant, applicantId, formId, open, rows, index, history, fields]);

  return {
    open,
    setOpen,
    applicant,
    applicantPopover: applicantPopover,
    setAndOpen,
  };
}
