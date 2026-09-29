"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FORM_LINKS,
  missingLaunchLinks,
} from "@/lib/utils/forms/emailVariables";
import { formContext } from "@/components/layouts/formTabView";
import {
  setFormDates,
  setFormDraft,
  updateForm,
} from "@/app/portal/admin/actions";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderCircleIcon,
  LockIcon,
  PlusIcon,
  RocketIcon,
  Trash2Icon,
} from "lucide-react";

type EditorOption = { value: string; label: string };
type EditorQuestion = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  options?: EditorOption[];
  config: {
    validation: {
      type: string;
      isRequired: boolean;
      isArray?: boolean;
    };
    multiple?: boolean;
    allowCustom?: boolean;
  };
};
type EditorStep = {
  id: string;
  title: string;
  target?: string;
  questions: EditorQuestion[];
};

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Long text",
  email: "Email",
  url: "URL",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  checkbox: "Checkbox",
  info: "Info box",
};

const ADDABLE_TYPES: { type: string; label: string }[] = [
  { type: "text", label: "Short text" },
  { type: "textarea", label: "Long text" },
  { type: "email", label: "Email" },
  { type: "url", label: "URL" },
  { type: "number", label: "Number" },
  { type: "date", label: "Date" },
  { type: "select", label: "Dropdown" },
  { type: "checkbox", label: "Checkbox" },
  { type: "info", label: "Info box" },
];

const isListType = (type: string) => type === "select" || type === "checkbox";

const VALIDATION_TYPE: Record<string, string> = {
  text: "string",
  textarea: "string",
  email: "email",
  url: "url",
  number: "number",
  date: "date",
  select: "select",
  checkbox: "select",
  info: "string",
};

function uniqueId(type: string, steps: EditorStep[]) {
  const used = new Set(
    steps.flatMap((s) => s.questions.map((q) => q.id)),
  );
  let n = 1;
  while (used.has(`${type}${n}`)) {
    n += 1;
  }
  return `${type}${n}`;
}

function makeQuestion(type: string, steps: EditorStep[]): EditorQuestion {
  const id = uniqueId(type, steps);
  const multiple = type === "checkbox";
  const validation = {
    type: VALIDATION_TYPE[type] ?? "string",
    isRequired: false,
    ...(type === "select" || type === "checkbox"
      ? { isArray: multiple }
      : {}),
  };
  return {
    id,
    type,
    label: "",
    placeholder: "",
    config: { validation, multiple },
    options: isListType(type) ? [] : undefined,
  };
}

function toInputParts(iso: Date | string | null | undefined) {
  if (!iso) {
    return { date: "", time: "" };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "", time: "" };
  }
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 16),
  };
}

export default function FormQuestionsEditorPage() {
  const { rawForm, submissions } = useContext(formContext);
  const router = useRouter();

  const isDraft = rawForm?.config?.application?.draft === true;
  const hasApps = (submissions?.length ?? 0) > 0;
  const builder = isDraft && !hasApps;
  const autoLocked = isDraft && hasApps;

  const [steps, setSteps] = useState<EditorStep[]>(() =>
    structuredClone(rawForm?.questions ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [armQuestion, setArmQuestion] = useState<string | null>(null);
  const [armLaunch, setArmLaunch] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openParts = toInputParts(rawForm?.open_at);
  const closeParts = toInputParts(rawForm?.close_at);
  const [openDate, setOpenDate] = useState(openParts.date);
  const [openTime, setOpenTime] = useState(openParts.time);
  const [closeDate, setCloseDate] = useState(closeParts.date);
  const [closeTime, setCloseTime] = useState(closeParts.time);
  const [savingDates, setSavingDates] = useState(false);

  useEffect(() => {
    return () => {
      if (armTimer.current) {
        clearTimeout(armTimer.current);
      }
    };
  }, []);

  function armDelete(questionId: string) {
    if (armQuestion === questionId) {
      setArmQuestion(null);
      return questionId;
    }
    setArmQuestion(questionId);
    if (armTimer.current) {
      clearTimeout(armTimer.current);
    }
    armTimer.current = setTimeout(() => setArmQuestion(null), 2500);
    return null;
  }

  const initialJson = useMemo(
    () => JSON.stringify(rawForm?.questions ?? []),
    [rawForm],
  );
  const dirty = JSON.stringify(steps) !== initialJson;

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    steps.forEach((step) => {
      step.questions.forEach((question) => {
        if (!builder && !question.label.trim()) {
          errors.push(`${question.id}: label is empty`);
        }
        const seenValues = new Set<string>();
        (question.options ?? []).forEach((option) => {
          if (!builder && !option.label.trim()) {
            errors.push(
              `${question.id}: option "${option.value || "?"}" has no label`,
            );
          }
          const value = option.value.trim();
          if (value && seenValues.has(value)) {
            errors.push(`${question.id}: duplicate option value "${value}"`);
          }
          seenValues.add(value);
        });
      });
    });
    return errors;
  }, [steps, builder]);

  if (!rawForm) {
    return null;
  }

  // ---------- mutations ----------

  function patchStep(
    stepIndex: number,
    mutate: (step: EditorStep) => void,
  ) {
    setSteps((prev) => {
      const next = structuredClone(prev);
      mutate(next[stepIndex]);
      return next;
    });
  }

  function updateQuestion(
    stepIndex: number,
    questionIndex: number,
    patch: Partial<EditorQuestion>,
  ) {
    patchStep(stepIndex, (step) => {
      step.questions[questionIndex] = {
        ...step.questions[questionIndex],
        ...patch,
      };
    });
  }

  function updateOption(
    stepIndex: number,
    questionIndex: number,
    optionIndex: number,
    label: string,
  ) {
    patchStep(stepIndex, (step) => {
      const options = step.questions[questionIndex].options ?? [];
      options[optionIndex] = { ...options[optionIndex], label };
      step.questions[questionIndex].options = options;
    });
  }

  function setOptionValue(
    stepIndex: number,
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) {
    patchStep(stepIndex, (step) => {
      const options = step.questions[questionIndex].options ?? [];
      options[optionIndex] = { ...options[optionIndex], value };
      step.questions[questionIndex].options = options;
    });
  }

  function addOption(stepIndex: number, questionIndex: number) {
    patchStep(stepIndex, (step) => {
      const options = step.questions[questionIndex].options ?? [];
      options.push({ value: "", label: "" });
      step.questions[questionIndex].options = options;
    });
  }

  function removeOption(
    stepIndex: number,
    questionIndex: number,
    optionIndex: number,
  ) {
    patchStep(stepIndex, (step) => {
      const options = step.questions[questionIndex].options ?? [];
      options.splice(optionIndex, 1);
      step.questions[questionIndex].options = options;
    });
  }

  function toggleRequired(
    stepIndex: number,
    questionIndex: number,
    value: boolean,
  ) {
    patchStep(stepIndex, (step) => {
      const question = step.questions[questionIndex];
      question.config.validation.isRequired = value;
    });
  }

  function toggleMultiple(
    stepIndex: number,
    questionIndex: number,
    value: boolean,
  ) {
    patchStep(stepIndex, (step) => {
      const question = step.questions[questionIndex];
      question.config.multiple = value;
      question.config.validation.isArray = value;
    });
  }

  function addQuestion(stepIndex: number, type: string) {
    setSteps((prev) => {
      const next = structuredClone(prev);
      next[stepIndex].questions.push(makeQuestion(type, next));
      return next;
    });
    setShowAddMenu(null);
  }

  function removeQuestion(stepIndex: number, questionIndex: number) {
    patchStep(stepIndex, (step) => {
      step.questions.splice(questionIndex, 1);
    });
  }

  function moveQuestion(
    stepIndex: number,
    questionIndex: number,
    direction: -1 | 1,
  ) {
    patchStep(stepIndex, (step) => {
      const target = questionIndex + direction;
      if (target < 0 || target >= step.questions.length) {
        return;
      }
      const [q] = step.questions.splice(questionIndex, 1);
      step.questions.splice(target, 0, q);
    });
  }

  function renameStep(stepIndex: number, title: string) {
    patchStep(stepIndex, (step) => {
      step.title = title;
    });
  }

  function addStep() {
    setSteps((prev) => {
      const next = structuredClone(prev);
      let n = 1;
      const used = new Set(next.map((s) => s.id));
      while (used.has(`step${n}`)) {
        n += 1;
      }
      next.push({
        id: `step${n}`,
        title: `New section`,
        target: "everyone",
        questions: [],
      });
      return next;
    });
  }

  function removeStep(stepIndex: number) {
    setSteps((prev) => {
      const next = structuredClone(prev);
      if (next.length <= 1) {
        return next;
      }
      next.splice(stepIndex, 1);
      return next;
    });
  }

  // ---------- persistence ----------

  async function handleSave() {
    if (validationErrors.length > 0) {
      toast.error(
        `Fix ${validationErrors.length} issue(s) before saving: ${validationErrors[0]}`,
      );
      return;
    }
    setSaving(true);
    try {
      await updateForm(Number(rawForm.id), {
        questions: steps as unknown as object[],
      });
      setSavedAt(new Date().toLocaleTimeString());
      toast.success("Question content saved");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Save failed — try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDates() {
    if (!openDate && !closeDate) {
      return;
    }
    setSavingDates(true);
    try {
      const openAt =
        openDate && openTime
          ? new Date(`${openDate}T${openTime}:00.000Z`).toISOString()
          : null;
      const closeAt =
        closeDate && closeTime
          ? new Date(`${closeDate}T${closeTime}:00.000Z`).toISOString()
          : null;
      await setFormDates(Number(rawForm.id), openAt, closeAt);
      toast.success("Application window saved");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save dates");
    } finally {
      setSavingDates(false);
    }
  }

  async function handleLaunch() {
    // Mirrors the server check so the reason is visible (server action errors
    // are hidden in production).
    const missing = missingLaunchLinks(rawForm.config);
    if (missing.length > 0) {
      toast.error(
        `Set the ${missing.map((k) => FORM_LINKS[k]).join(", ")} link under Settings → Form links before launching.`,
      );
      return;
    }
    if (dirty) {
      await updateForm(Number(rawForm.id), {
        questions: steps as unknown as object[],
      });
    }
    try {
      await setFormDraft(Number(rawForm.id), false);
      toast.success("Form launched — structure is now locked");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Launch failed — try again");
    }
  }

  // ---------- render ----------

  const canSave =
    dirty && validationErrors.length === 0 && !saving && !savingDates;

  return (
    <div className="flex flex-col gap-4 pb-20 flex-1 items-center w-full px-4">
      <div className="flex flex-wrap w-full sticky top-0 z-10 justify-between items-center gap-3 bg-background-800 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-xl">Form Questions</h2>
            <span
              className={`text-[10px] font-semibold uppercase tracking-widest rounded-full px-2 py-0.5 border ${
                builder
                  ? "border-amber-400/60 text-amber-300 bg-amber-400/10"
                  : "border-lp-400/60 text-lp-300 bg-lp-400/10"
              }`}
            >
              {builder ? "Draft" : "Launched"}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            {builder ? (
              <>
                <PlusIcon size={12} />
                Build freely — add, remove, and reorder questions. The
                structure locks the moment you launch or an application
                starts.
              </>
            ) : (
              <>
                <LockIcon size={12} />
                Question structure is locked — no adding, removing, or
                reordering questions. You can reword questions and add,
                remove, or relabel dropdown options.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-neutral-400">Saved {savedAt}</span>
          )}
          {builder && (
            <Button
              disabled={armLaunch}
              onClick={() => {
                if (!armLaunch) {
                  setArmLaunch(true);
                  setTimeout(() => setArmLaunch(false), 2500);
                  return;
                }
                setArmLaunch(false);
                handleLaunch();
              }}
              className="bg-gradient-to-r from-lp-700 via-lp-500 to-lp-400 text-white border-0"
            >
              <RocketIcon className="w-4 h-4 mr-2" />
              {armLaunch ? "Confirm launch?" : "Launch form"}
            </Button>
          )}
          <Button
            disabled={!canSave}
            onClick={handleSave}
            className={canSave ? "animate-pulse" : ""}
          >
            {saving && (
              <LoaderCircleIcon className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      {autoLocked && (
        <div className="w-full max-w-4xl rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          An application already exists, so this draft&apos;s structure was
          locked automatically. You can still reword content and adjust the
          application window below.
        </div>
      )}

      {/* application window */}
      <section className="flex flex-col gap-3 w-full max-w-4xl rounded-md p-4 bg-background-800 border border-background-600">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-semibold">Application window</h3>
            <p className="text-xs text-neutral-400">
              Times are UTC. Applicants see &quot;closed&quot; outside this
              window.
            </p>
          </div>
          <Button
            size="sm"
            disabled={savingDates}
            onClick={handleSaveDates}
            className="self-end"
          >
            {savingDates && (
              <LoaderCircleIcon className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save window
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Opens (date)</label>
            <Input
              type="date"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              className="p-2 bg-background-700 border-background-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Opens (time)</label>
            <Input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="p-2 bg-background-700 border-background-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Closes (date)</label>
            <Input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="p-2 bg-background-700 border-background-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Closes (time)</label>
            <Input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="p-2 bg-background-700 border-background-500"
            />
          </div>
        </div>
      </section>

      {/* steps */}
      <div className="flex flex-col gap-6 w-full max-w-4xl">
        {steps.map((step, stepIndex) => (
          <section
            key={step.id}
            className="flex flex-col gap-3 w-full rounded-md p-4 bg-background-800 border border-background-600"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {builder ? (
                <Input
                  value={step.title}
                  onChange={(e) => renameStep(stepIndex, e.target.value)}
                  aria-label="Section title"
                  className="p-2 bg-background-700 border-background-500 font-semibold max-w-sm"
                />
              ) : (
                <h3 className="text-base font-semibold">{step.title}</h3>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">
                  {step.questions.length} question
                  {step.questions.length === 1 ? "" : "s"}
                </span>
                {builder && (
                  <button
                    type="button"
                    onClick={() => removeStep(stepIndex)}
                    disabled={steps.length <= 1}
                    className="rounded p-1 text-neutral-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                    aria-label="Remove section"
                    title="Remove section"
                  >
                    <Trash2Icon size={14} />
                  </button>
                )}
              </div>
            </div>

            {step.questions.map((question, questionIndex) => {
              const armKey = `${stepIndex}:${questionIndex}`;
              const armed = armQuestion === armKey;
              return (
                <div
                  key={question.id}
                  className="rounded-lg border border-background-600 bg-background-700 p-3 sm:p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-background-500 bg-background-600 rounded-full px-2.5 py-0.5 text-xs text-lp-300 font-medium uppercase tracking-wide">
                      {TYPE_LABELS[question.type] ?? question.type}
                    </span>
                    <code className="text-xs text-neutral-400 font-mono truncate max-w-[220px]">
                      {question.id}
                    </code>
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      {question.config.validation.isRequired
                        ? "Required"
                        : "Optional"}
                    </span>
                    {builder && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() =>
                            moveQuestion(stepIndex, questionIndex, -1)
                          }
                          disabled={questionIndex === 0}
                          className="rounded p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                          aria-label="Move up"
                        >
                          <ChevronUpIcon size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moveQuestion(stepIndex, questionIndex, 1)
                          }
                          disabled={
                            questionIndex === step.questions.length - 1
                          }
                          className="rounded p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                          aria-label="Move down"
                        >
                          <ChevronDownIcon size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const confirmed = armDelete(armKey);
                            if (confirmed) {
                              removeQuestion(stepIndex, questionIndex);
                            }
                          }}
                          className={`rounded p-1 transition-colors ${
                            armed
                              ? "bg-red-500 text-white"
                              : "text-neutral-400 hover:text-red-400"
                          }`}
                          aria-label="Remove question"
                          title={armed ? "Click again to confirm" : "Remove"}
                        >
                          <Trash2Icon size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`label-${stepIndex}-${questionIndex}`}
                      className="text-xs text-neutral-400"
                    >
                      Question text
                    </label>
                    {question.type === "info" ? (
                      <textarea
                        id={`label-${stepIndex}-${questionIndex}`}
                        value={question.label}
                        onChange={(e) =>
                          updateQuestion(stepIndex, questionIndex, {
                            label: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder="Text shown to applicants (supports [link text](https://…))"
                        className="w-full p-2 text-sm bg-background-800 border border-background-500 rounded-md focus:outline-none focus:border-lp-400"
                      />
                    ) : (
                      <Input
                        id={`label-${stepIndex}-${questionIndex}`}
                        value={question.label}
                        onChange={(e) =>
                          updateQuestion(stepIndex, questionIndex, {
                            label: e.target.value,
                          })
                        }
                        placeholder={
                          question.type === "info"
                            ? ""
                            : "Question text shown to applicants"
                        }
                        className="p-2 bg-background-800 border-background-500"
                      />
                    )}
                  </div>

                  {builder && !isListType(question.type) && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleRequired(
                            stepIndex,
                            questionIndex,
                            !question.config.validation.isRequired,
                          )
                        }
                        className={`rounded-full border px-3 py-0.5 text-xs transition-colors ${
                          question.config.validation.isRequired
                            ? "border-lp-400 bg-lp-500 text-white"
                            : "border-background-500 bg-background-600 text-neutral-300 hover:border-background-400"
                        }`}
                      >
                        Required
                      </button>
                    </div>
                  )}

                  {isListType(question.type) && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-400">
                          Options
                        </span>
                        {builder && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                toggleRequired(
                                  stepIndex,
                                  questionIndex,
                                  !question.config.validation.isRequired,
                                )
                              }
                              className={`rounded-full border px-3 py-0.5 text-xs transition-colors ${
                                question.config.validation.isRequired
                                  ? "border-lp-400 bg-lp-500 text-white"
                                  : "border-background-500 bg-background-600 text-neutral-300 hover:border-background-400"
                              }`}
                            >
                              Required
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                toggleMultiple(
                                  stepIndex,
                                  questionIndex,
                                  !(question.config.multiple ?? false),
                                )
                              }
                              className={`rounded-full border px-3 py-0.5 text-xs transition-colors ${
                                question.config.multiple
                                  ? "border-lp-400 bg-lp-500 text-white"
                                  : "border-background-500 bg-background-600 text-neutral-300 hover:border-background-400"
                              }`}
                            >
                              Multiple
                            </button>
                          </div>
                        )}
                      </div>
                      {(question.options?.length ?? 0) === 0 && (
                        <p className="text-xs text-neutral-500">
                          No options yet — add the first one below.
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5">
                        {(question.options ?? []).map(
                          (option, optionIndex) => (
                            <div
                              key={`${question.id}-${optionIndex}`}
                              className="flex items-center gap-2"
                            >
                              {option.value ? (
                                <code className="text-xs text-neutral-500 font-mono w-28 sm:w-36 shrink-0 truncate">
                                  {option.value}
                                </code>
                              ) : (
                                <Input
                                  value={option.value}
                                  onChange={(e) =>
                                    setOptionValue(
                                      stepIndex,
                                      questionIndex,
                                      optionIndex,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="value id"
                                  aria-label={`Value id for new option ${optionIndex + 1}`}
                                  className="p-2 w-28 sm:w-36 shrink-0 bg-background-800 border-lp-400/60 font-mono text-xs"
                                />
                              )}
                              <Input
                                value={option.label}
                                onChange={(e) =>
                                  updateOption(
                                    stepIndex,
                                    questionIndex,
                                    optionIndex,
                                    e.target.value,
                                  )
                                }
                                aria-label={`Label for ${option.value || "new option"}`}
                                className="p-2 flex-1 min-w-0 bg-background-800 border-background-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeOption(
                                    stepIndex,
                                    questionIndex,
                                    optionIndex,
                                  )
                                }
                                className="shrink-0 rounded p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                aria-label={`Remove option ${option.label || option.value}`}
                                title="Remove option"
                              >
                                <Trash2Icon size={15} />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(stepIndex, questionIndex)}
                        className="flex items-center gap-1.5 w-fit text-xs font-medium text-lp-300 hover:text-lp-200 px-1 py-1"
                      >
                        <PlusIcon size={14} />
                        Add option
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {step.questions.length === 0 && builder && (
              <p className="text-xs text-neutral-500 py-1">
                This section has no questions yet.
              </p>
            )}

            {builder && (
              <div className="flex flex-col gap-2">
                {showAddMenu === stepIndex ? (
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-background-600 bg-background-700 p-2.5">
                    {ADDABLE_TYPES.map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => addQuestion(stepIndex, t.type)}
                        className="rounded-full border border-background-500 bg-background-600 px-3 py-1 text-xs text-neutral-200 hover:border-lp-400 hover:text-white transition-colors"
                      >
                        + {t.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddMenu(
                        showAddMenu === stepIndex ? null : stepIndex,
                      )
                    }
                    className="flex items-center gap-1.5 w-fit text-sm font-medium text-lp-300 hover:text-lp-200 px-1 py-1"
                  >
                    <PlusIcon size={15} />
                    Add question
                  </button>
                )}
              </div>
            )}
          </section>
        ))}

        {builder && (
          <button
            type="button"
            onClick={addStep}
            className="flex items-center justify-center gap-1.5 w-full rounded-md border border-dashed border-background-500 py-3 text-sm text-neutral-300 hover:border-lp-400 hover:text-white transition-colors"
          >
            <PlusIcon size={15} />
            Add section
          </button>
        )}
      </div>
    </div>
  );
}
