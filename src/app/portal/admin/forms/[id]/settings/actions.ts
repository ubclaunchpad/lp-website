"use server";
import { db } from "@/db";
import { requireAdmin } from "@/lib/utils/auth";
import { z } from "zod";
import {
  FORM_LINKS,
  FormLinks,
  REQUIRED_AT_LAUNCH,
} from "@/lib/utils/forms/emailVariables";

type EmailTemplate = {
  title: string;
  content: string;
};

export async function updateOrCreateEmailTemplate(
  formId: number,
  status: string,
  template: EmailTemplate,
) {
  await requireAdmin();
  try {
    // First get the current form to access existing config
    const form = await db.forms.findFirst({
      where: { id: BigInt(formId) },
    });

    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    // Get existing config or initialize if doesn't exist
    const currentConfig = (form.config as Record<string, any>) || {};

    // Safely create nested structure if it doesn't exist
    const updatedConfig = {
      ...currentConfig,
      application: {
        ...currentConfig.application,
        emails: {
          ...(currentConfig.application?.emails || {}),
          status: {
            ...(currentConfig.application?.emails?.status || {}),
            [status]: template,
          },
        },
      },
    };

    // Update only the config field
    await db.forms.update({
      where: { id: BigInt(formId) },
      data: {
        config: updatedConfig,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating email template:", error);
    throw error;
  }
}

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Links must start with http(s)://");
const optionalUrl = z.union([httpUrl, z.literal("")]);

const LinkSettingsSchema = z.object({
  links: z.object(
    Object.fromEntries(
      Object.keys(FORM_LINKS).map((key) => [key, optionalUrl.optional()]),
    ) as Record<keyof typeof FORM_LINKS, z.ZodOptional<typeof optionalUrl>>,
  ),
  bookingLinks: z.record(z.string().uuid(), optionalUrl),
});

// Blank fields are dropped so a cleared link reads as "not set".
function withoutBlanks(record: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value),
  ) as Record<string, string>;
}

// Saves the form's term links ({{projectCatalog}}, {{paymentLink}},
// {{kickoffRsvp}}) and interviewer booking links ({{bookingLink}}). Returns
// errors instead of throwing so the settings UI can show them.
export async function updateFormLinkSettings(
  formId: number,
  settings: { links: FormLinks; bookingLinks: Record<string, string> },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = LinkSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid link" };
  }
  const form = await db.forms.findFirst({ where: { id: BigInt(formId) } });
  if (!form) {
    return { ok: false, error: "Form not found" };
  }
  const currentConfig = (form.config as Record<string, any>) || {};
  const application = currentConfig.application ?? {};
  const links = withoutBlanks(parsed.data.links);
  // A launched form must keep the links applicants depend on.
  if (!application.draft) {
    const missing = REQUIRED_AT_LAUNCH.filter((key) => !links[key]);
    if (missing.length > 0) {
      return {
        ok: false,
        error: `This form is live, so the ${missing.map((k) => FORM_LINKS[k]).join(", ")} link can't be removed.`,
      };
    }
  }
  await db.forms.update({
    where: { id: BigInt(formId) },
    data: {
      config: {
        ...currentConfig,
        application: {
          ...application,
          links,
          interviewEmail: {
            ...(application.interviewEmail ?? {}),
            bookingLinks: withoutBlanks(parsed.data.bookingLinks),
          },
        },
      },
    },
  });
  return { ok: true };
}

// Opens/closes the /application/teams reveal for members of this form.
export async function setTeamRevealOpen(
  formId: number,
  open: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const form = await db.forms.findFirst({ where: { id: BigInt(formId) } });
  if (!form) {
    return { ok: false, error: "Form not found" };
  }
  const config = (form.config as Record<string, any>) || {};
  await db.forms.update({
    where: { id: BigInt(formId) },
    data: {
      config: {
        ...config,
        application: {
          ...config.application,
          teamReveal: { ...(config.application?.teamReveal ?? {}), open },
        },
      },
    },
  });
  return { ok: true };
}
