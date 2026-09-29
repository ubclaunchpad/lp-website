"use server";
import { db } from "@/db";
import { requireAdmin } from "@/lib/utils/auth";
import { z } from "zod";
import { InterviewEmailSettings } from "@/lib/utils/forms/emailVariables";

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

const InterviewEmailSettingsSchema = z.object({
  projectCatalog: z.union([httpUrl, z.literal("")]).optional(),
  bookingLinks: z.record(z.string().uuid(), z.union([httpUrl, z.literal("")])),
});

// Saves the per-term values interview emails fill in ({{projectCatalog}},
// {{bookingLink}}). Returns errors instead of throwing so the UI can show them.
export async function updateInterviewEmailSettings(
  formId: number,
  settings: InterviewEmailSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = InterviewEmailSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }
  const form = await db.forms.findFirst({ where: { id: BigInt(formId) } });
  if (!form) {
    return { ok: false, error: "Form not found" };
  }
  const currentConfig = (form.config as Record<string, any>) || {};
  // Drop blanks so a cleared field reads as "not set".
  const bookingLinks = Object.fromEntries(
    Object.entries(parsed.data.bookingLinks).filter(([, link]) => link),
  );
  await db.forms.update({
    where: { id: BigInt(formId) },
    data: {
      config: {
        ...currentConfig,
        application: {
          ...currentConfig.application,
          interviewEmail: {
            ...(parsed.data.projectCatalog && {
              projectCatalog: parsed.data.projectCatalog,
            }),
            bookingLinks,
          },
        },
      },
    },
  });
  return { ok: true };
}
