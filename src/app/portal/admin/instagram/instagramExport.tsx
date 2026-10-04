"use client";
import { toast } from "sonner";
import { CopyIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/primitives/button";

type Handle = { name: string; email: string; username: string; member: boolean; updated: string };

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export default function InstagramExport({ handles }: { handles: Handle[] }) {
  function copyAll() {
    // Space-separated @mentions, ready to paste into a caption.
    navigator.clipboard
      .writeText(handles.map((h) => `@${h.username}`).join(" "))
      .then(() => toast.success(`Copied ${handles.length} handles`))
      .catch(() => toast.error("Couldn't copy"));
  }

  function downloadCsv() {
    const lines = [
      ["name", "email", "instagram", "member", "updated"].join(","),
      ...handles.map((h) =>
        [h.name, h.email, h.username, String(h.member), h.updated].map(csvCell).join(","),
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "instagram-handles.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={copyAll} disabled={!handles.length} className="gap-2 bg-background-600">
        <CopyIcon className="h-4 w-4" /> Copy @mentions
      </Button>
      <Button size="sm" onClick={downloadCsv} disabled={!handles.length} className="gap-2">
        <DownloadIcon className="h-4 w-4" /> CSV
      </Button>
    </div>
  );
}
