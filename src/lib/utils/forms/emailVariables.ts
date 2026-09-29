// Email template tags that don't come from the applicant's answers. Values are
// resolved per send from the form's interview-email settings and the
// application's assigned interviewer. Plain module: safe to import from both
// client components and server code.

export const EMAIL_VARIABLES = {
  projectCatalog: "Project catalog link (Interview emails settings)",
  interviewerName: "Assigned interviewer's name",
  bookingLink: "Assigned interviewer's booking link",
} as const;

export type EmailVariable = keyof typeof EMAIL_VARIABLES;

// Stored at forms.config.application.interviewEmail; changes each term.
export type InterviewEmailSettings = {
  projectCatalog?: string;
  // Keyed by the interviewer's user id.
  bookingLinks?: Record<string, string>;
};

// Status an application moves to once its email for the given status is sent.
export const STATUS_AFTER_EMAIL: Record<string, string> = {
  to_interview: "emailed_for_interview",
};

export function getInterviewEmailSettings(
  formConfig: any,
): InterviewEmailSettings {
  return formConfig?.application?.interviewEmail ?? {};
}

export function usedEmailVariables(content: string): EmailVariable[] {
  return (Object.keys(EMAIL_VARIABLES) as EmailVariable[]).filter((key) =>
    content.includes(`{{${key}}}`),
  );
}
