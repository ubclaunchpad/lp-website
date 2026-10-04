"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AtSignIcon, CheckIcon, LoaderCircleIcon } from "lucide-react";
import { instagramUrl, normalizeInstagram } from "@/lib/utils/instagram";
import { removeInstagram, saveInstagram } from "./actions";

export default function InstagramForm({ initial }: { initial: string | null }) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const preview = value.trim() ? normalizeInstagram(value) : null;
  const invalid = value.trim() !== "" && !preview;
  const unchanged = preview !== null && preview === saved;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview || unchanged) return;
    setBusy(true);
    const result = await saveInstagram(value);
    setBusy(false);
    if (result.ok) {
      setSaved(result.username);
      setValue(result.username ?? "");
      toast.success("Saved, thanks!");
    } else {
      toast.error(result.error);
    }
  }

  async function remove() {
    setBusy(true);
    await removeInstagram();
    setBusy(false);
    setSaved(null);
    setValue("");
    toast.success("Removed");
  }

  return (
    <form
      onSubmit={submit}
      className="glass-panel flex w-full max-w-md flex-col gap-5 p-6 text-base animate-fade-up sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          Share your Instagram
        </h1>
        <p className="text-sm text-neutral-300">
          Add your Instagram so Launch Pad can tag you in posts and photos.
          Only club admins can see it.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-200">Username</span>
        <div
          className={`flex items-center rounded-xl border bg-background-700 px-3 focus-within:ring-2 focus-within:ring-lp-400 ${invalid ? "border-red-500" : "border-background-500"}`}
        >
          <AtSignIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            className="w-full bg-transparent px-2 py-3 text-base text-white outline-none placeholder:text-neutral-500"
          />
        </div>
        <span className={`text-xs ${invalid ? "text-red-400" : "text-neutral-400"}`}>
          {invalid
            ? "Letters, numbers, periods and underscores only (max 30)."
            : "You can paste your profile link too."}
        </span>
      </label>

      <button
        type="submit"
        disabled={busy || !preview || unchanged}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lp-700 via-lp-500 to-lp-400 px-6 py-3 font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {busy ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : unchanged ? (
          <CheckIcon className="h-4 w-4" />
        ) : null}
        {unchanged ? "Saved" : saved ? "Update" : "Save"}
      </button>

      {saved && (
        <div className="flex items-center justify-between gap-3 text-sm text-neutral-300">
          <a
            href={instagramUrl(saved)}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-lp-300 underline underline-offset-2"
          >
            instagram.com/{saved}
          </a>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="shrink-0 text-neutral-400 hover:text-white"
          >
            Remove
          </button>
        </div>
      )}
    </form>
  );
}
