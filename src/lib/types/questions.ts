import { ZodType, ZodIssue } from "zod";
import { FormItemValidation } from "@/lib/types/forms";

export type QuestionFormat =
  | "text"
  | "email"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox"
  | "url"
  | "info";

export type BaseFormQuestion = {
  type: QuestionFormat;
  label: string;
  id: string;
  placeholder: string;
  config: {
    validation: FormItemValidation;
  };
};

export type ListFormQuestion = BaseFormQuestion & {
  type: "select" | "checkbox";
  options: Record<string, string>[];
  config: {
    validation: FormItemValidation;
    multiple?: boolean;
    allowCustom?: boolean;
  };
};

export type FormQuestion =
  | (BaseFormQuestion & {
      type: Exclude<QuestionFormat, "select" | "checkbox">;
    })
  | ListFormQuestion;

export const STEP_TARGETS = {
  everyone: "everyone",
  designer: "designer",
  developer: "developer",
} as const;

export type BasicForm = {
  questions: FormQuestion[];
};

export type FormStep = {
  title: string;
  target: (typeof STEP_TARGETS)[keyof typeof STEP_TARGETS];
} & BasicForm;

export type Obj = Record<string, string | string[] | null | number | number[]>;

// Status a new application starts in, so it lands in the "To Review" queue
export const DEFAULT_APPLICATION_STATUS = "review";

export type Application = {
  details: Obj;
  status:
    | "pending"
    | "review"
    | "submitted"
    | "rejected"
    | "accepted"
    | "waitlisted"
    | "withdrawn"
    | "interviewing"
    | "interviewed"
    | "offered"
    | "declined";
  meta: {
    submittedAt: Date | null;
    notes: string | null;
    team: string | null;
    reviewer: string | null;
    level: "beginner" | "junior" | "intermediate" | "senior" | "not determined";
  };
  id: string;
};

export type FormItem = {
  errors: ZodIssue[];
  type: QuestionFormat;
  initialValue: string | string[] | null | number | number[] | undefined;
  value: string | string[] | null | number | number[] | undefined;
  validation: ZodType<any>;
  state: {
    isValid: "VALID" | "INVALID" | "NOT_VALIDATED";
  };
  eventHandlers: {
    onFocus: () => void;
    onBlur: () => void;
    onChange: (value: string | string[] | null | number | number[]) => void;
  };
};

export type FormDetails = {
  [key: string]: FormItem;
};
