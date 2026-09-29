// Template tags that don't come from the applicant's answers. Plain module:
// safe to import from both client components and server code.

// Links that change every term, set per form under Settings → Form links and
// stored at forms.config.application.links. Referenced as {{key}} in question
// labels, the offer page and email templates.
export const FORM_LINKS = {
  projectCatalog: "Project catalog",
  paymentLink: "Membership fee payment (Stripe)",
  kickoffRsvp: "Kickoff RSVP (Luma)",
} as const;

export type FormLinkKey = keyof typeof FORM_LINKS;
export type FormLinks = Partial<Record<FormLinkKey, string>>;

// Applicants need the catalog while applying, so a form can't launch without
// it. Payment/RSVP are only checked when an offer email is sent.
export const REQUIRED_AT_LAUNCH: FormLinkKey[] = ["projectCatalog"];

export const EMAIL_VARIABLES = {
  ...FORM_LINKS,
  interviewerName: "Assigned interviewer's name",
  bookingLink: "Assigned interviewer's booking link",
} as const;

export type EmailVariable = keyof typeof EMAIL_VARIABLES;

// Stored at forms.config.application.interviewEmail. Keyed by the
// interviewer's user id; carried over when a form is duplicated.
export type InterviewEmailSettings = {
  bookingLinks?: Record<string, string>;
};

// Status an application moves to once its email for the given status is sent.
export const STATUS_AFTER_EMAIL: Record<string, string> = {
  to_interview: "emailed_for_interview",
};

export function getFormLinks(formConfig: any): FormLinks {
  return formConfig?.application?.links ?? {};
}

export function getInterviewEmailSettings(
  formConfig: any,
): InterviewEmailSettings {
  return formConfig?.application?.interviewEmail ?? {};
}

export function missingLaunchLinks(formConfig: any): FormLinkKey[] {
  const links = getFormLinks(formConfig);
  return REQUIRED_AT_LAUNCH.filter((key) => !links[key]);
}

// Replaces {{projectCatalog}} etc. with the form's links; unset links become
// empty so a raw tag is never shown to applicants.
export function fillFormLinks(text: string, links: FormLinks): string {
  return (Object.keys(FORM_LINKS) as FormLinkKey[]).reduce(
    (out, key) => out.split(`{{${key}}}`).join(links[key] ?? ""),
    text,
  );
}

export function usedEmailVariables(content: string): EmailVariable[] {
  return (Object.keys(EMAIL_VARIABLES) as EmailVariable[]).filter((key) =>
    content.includes(`{{${key}}}`),
  );
}
