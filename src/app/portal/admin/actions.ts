"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAdmin } from "@/lib/utils/auth";
import { getFormById } from "@/lib/utils/forms/server";
import { DELETE_FORM_CONFIRMATION } from "@/lib/utils/forms/helpers";
import { FormStep } from "@/lib/types/questions";
import { FormFields } from "@/components/forms/applications/columns";
import { sendEmail } from "@/lib/utils/forms/email";
import { MarkdownTemplate } from "@/components/forms/emailTemplates/markdownTemplate";
import { render } from "@react-email/components";
import { object } from "zod";

export async function getForms() {
  await requireAdmin();
  return db.forms.findMany();
}

export async function createForm(data: { title: string }) {
  await requireAdmin();
  const form = await db.forms.create({
    data: {
      title: data.title,
      config: { application: { draft: true } },
      questions: [
        {
          id: "step1",
          title: "Application",
          target: "everyone",
          questions: [],
        },
      ],
    },
  });
  return Number(form.id);
}

export async function cloneForm(id: number) {
  await requireAdmin();
  const source = await db.forms.findUnique({ where: { id: BigInt(id) } });
  if (!source) {
    throw new Error("Form not found");
  }
  // Copy structure (questions, config incl. email templates + offer page)
  // but never dates or submissions — the new form starts unopened. A clone
  // is a draft: it can be restructured in the builder before launching.
  const clonedConfig = structuredClone((source.config as any) ?? {});
  clonedConfig.application = {
    ...(clonedConfig.application ?? {}),
    draft: true,
  };
  return db.forms.create({
    data: {
      title: `${source.title} (Copy)`,
      questions: source.questions as any,
      config: clonedConfig,
      type: source.type,
    },
  });
}

export async function getFormSubmissionCount(id: number) {
  await requireAdmin();
  return db.submissions.count({ where: { form_id: BigInt(id) } });
}

// Submissions, applications and their status history are removed by the
// ON DELETE CASCADE foreign keys. A form holding submissions requires the
// typed confirmation phrase, re-checked here so the client can't skip it.
export async function deleteForm(id: number, confirmation?: string) {
  await requireAdmin();
  const submissionCount = await getFormSubmissionCount(id);
  if (
    submissionCount > 0 &&
    confirmation?.trim() !== DELETE_FORM_CONFIRMATION
  ) {
    throw new Error("Form has submissions; confirmation phrase required");
  }
  await db.forms.delete({ where: { id: BigInt(id) } });
  revalidatePath("/portal/admin", "layout");
}

export async function setFormDraft(id: number, draft: boolean) {
  await requireAdmin();
  const form = await db.forms.findUnique({ where: { id: BigInt(id) } });
  if (!form) {
    throw new Error("Form not found");
  }
  const config = structuredClone((form.config as any) ?? {});
  config.application = { ...(config.application ?? {}), draft };
  return db.forms.update({
    where: { id: BigInt(id) },
    data: { config },
  });
}

export async function setFormDates(
  id: number,
  openAt: string | null,
  closeAt: string | null,
) {
  await requireAdmin();
  return db.forms.update({
    where: { id: BigInt(id) },
    data: {
      open_at: openAt ? new Date(openAt) : null,
      close_at: closeAt ? new Date(closeAt) : null,
    },
  });
}

export async function updateForm(
  id: number,
  data: {
    title: string;
    description: string;
    config: object;
    questions: object[];
  },
) {
  await requireAdmin();
  return db.forms.update({ where: { id }, data });
}

export async function getSubmissions(
  formId: number,
  onlySubmitted: boolean = true,
  filters: any | undefined = {},
) {
  await requireAdmin();
  const app = await db.submissions.findMany({
    include: {
      users: true,
      applications: true,
    },
    where: {
      form_id: BigInt(formId),
      ...(onlySubmitted && {
        status: { not: "pending" },
      }),
      ...filters,
    },
  });

  return app.map((submission: any) => {
    const details = submission.details ? (submission.details as any) : {};
    return {
      ...submission,
      ...details,
      email: submission.users?.email,
      userid: submission.users?.id,
      ...submission.applications,
    };
  });
}

function formatFormFields(questionSteps: FormStep[]): FormFields {
  const questionMap: FormFields = {};
  questionSteps.forEach((step) => {
    step.questions.forEach((question) => {
      let options: any[] = [];
      if (question.type === "select") {
        options = question.options?.map((option) => {
          return {
            id: option.value,
            label: option.label,
            value: option.value,
          };
        });
      }
      questionMap[question.id] = {
        label: question.label,
        id: question.id,
        options: options,
        type: question.type,
      };
    });
  });
  return questionMap;
}

export async function getAllFormDetails(
  formId: bigint,
): Promise<{ rawForm: any; formFields: FormFields; submissions: any[] }> {
  await requireAdmin();
  try {
    const form = await db.forms.findFirst({
      where: { id: formId },
    });

    if (!form) {
      return { rawForm: null, formFields: {}, submissions: [] };
    }

    const formFields = formatFormFields(
      form.questions as unknown as FormStep[],
    );
    const formType = form.type ? form.type.toString().toLowerCase() : "other";
    const formConfig = form.config as unknown as Record<string, any>;

    if (formType === "recruitment") {
      formFields["email"] = {
        label: "Email",
        id: "email",
        type: "email",
      };

      if (formConfig["application"]) {
        const subFields = formConfig["application"]["subfields"] || [];
        subFields.forEach((field: any) => {
          formFields[field.id] = {
            ...field,
            label: field.label,
            type: field.type,
            options: field.options,
          };
        });
      }
    }
    const submissions = await getSubmissions(formId as unknown as number);

    return { rawForm: form, formFields, submissions };
  } catch (e) {
    console.log(e);
    return { rawForm: null, formFields: {}, submissions: [] };
  }
}

type temp = {
  columns: string[];
};

interface AggregatedValue {
  id: string;
  count: number;
  label: string;
}

interface AggregationResult {
  charInfo: {
    title: string;
    description: string;
  };
  chartData: AggregatedValue[];
  chartConfig: any; // Replace 'any' with the appropriate type if you know it
}

export async function updateSubmissionField(
  submissionId: string,
  field: string,
  tableName: string | undefined,
  value: any,
  cta: boolean = false,
) {
  const admin = await requireAdmin();
  if (tableName === "applications") {
    const previous = await db.applications.findUnique({
      where: { id: submissionId },
      select: { status: true },
    });
    await db.applications.update({
      where: { id: submissionId },
      data: {
        [field]: value,
      },
    });
    if (field === "status") {
      await db.application_status_history.create({
        data: {
          application_id: submissionId,
          old_status: previous?.status ?? null,
          new_status: value ?? null,
          changed_by: admin.id,
        },
      });
      if (cta) {
        const submission = await db.submissions.findFirst({
          where: {
            id: submissionId,
          },
        });

        if (!submission) {
          console.log("Submission not found");
          return;
        }
        await sendStatusEmail({
          status: value,
          formId: submission.form_id,
          userId: submission.user_id,
        });
      }
    }
  }
}

export async function getStatusHistory(applicationId: string) {
  await requireAdmin();
  return db.application_status_history.findMany({
    where: { application_id: applicationId },
    orderBy: { created_at: "desc" },
    take: 20,
    include: {
      users: { select: { email: true } },
    },
  });
}

const BULK_ASSIGNABLE_FIELDS = ["reviewer_id", "interviewer_id", "level"] as const;

export async function bulkUpdateSubmissionField(
  ids: string[],
  field: string,
  value: any,
) {
  const admin = await requireAdmin();
  if (!BULK_ASSIGNABLE_FIELDS.includes(field as any)) {
    throw new Error("Bulk updates are restricted to reviewer/interviewer/level");
  }
  if (!ids.length) {
    return 0;
  }
  await db.$transaction(
    ids.map((id) =>
      db.applications.update({ where: { id }, data: { [field]: value } }),
    ),
  );
  return ids.length;
}

// Renders the status-email template for an applicant without sending.
async function renderStatusEmail({
  status,
  formId,
  userId,
}: {
  status: string;
  formId: bigint;
  userId: string;
}): Promise<{ subject: string; html: string } | null> {
  const form = await getFormById(formId);

  if (!form) {
    console.log("Form not found");
    return null;
  }
  const app = await db.submissions.findFirst({
    where: {
      form_id: formId,
      user_id: userId,
    },
    include: {
      applications: true,
      users: true,
    },
  });

  if (!app) {
    console.log("Application not found");
    return null;
  }

  const formConfig = form.config as any;
  const config = formConfig.application as any;

  if (
    !config ||
    !config.emails ||
    !config.emails.status ||
    !config.emails.status[status]
  ) {
    console.log("Email template not found");
    return null;
  }

  const emailTemplate = config.emails.status[status];
  const title = emailTemplate.title;
  const content = emailTemplate.content;
  const details = app.details ? (app.details as any) : {};
  const template = await render(
    MarkdownTemplate({ markdown: content, replacements: details }),
  );

  return { subject: title, html: template };
}

export async function previewStatusEmail(
  submissionId: string,
  status: string,
) {
  await requireAdmin();
  const submission = await db.submissions.findFirst({
    where: { id: submissionId },
  });
  if (!submission) {
    return null;
  }
  return renderStatusEmail({
    status,
    formId: submission.form_id,
    userId: submission.user_id,
  });
}

export async function sendStatusEmailToUser(
  submissionId: string,
  value: string,
) {
  await requireAdmin();
  const submission = await db.submissions.findFirst({
    where: {
      id: submissionId,
    },
  });

  if (!submission) {
    console.log("Submission not found");
    return;
  }

  await sendStatusEmail({
    status: value,
    formId: submission.form_id,
    userId: submission.user_id,
  });
}

export async function getAdminMembers() {
  await requireAdmin();
  const res = await db.roles.findMany({
    where: {
      roles: {
        contains: "admin",
      },
    },
    include: {
      users: true,
    },
  });

  return res.map((p) => {
    return {
      ...p.users,
      ...p,
      id: p.users.id,
      email: p.users.email,
    };
  });
}

export async function addAdminByEmail(email: string) {
  await requireAdmin();
  const user = await db.users.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });
  if (!user) {
    throw new Error(
      "No Launch Pad account found for that email — they must sign in with Google once before they can be promoted.",
    );
  }
  await db.roles.upsert({
    where: { id: user.id },
    create: { id: user.id, roles: "admin" },
    update: { roles: "admin" },
  });
  return { email: user.email, id: user.id };
}

export async function removeAdmin(userId: string) {
  const user = await requireAdmin();
  if (userId === user.id) {
    throw new Error("You cannot remove your own admin access.");
  }
  const adminCount = await db.roles.count({
    where: { roles: { contains: "admin" } },
  });
  if (adminCount <= 1) {
    throw new Error("Cannot remove the last remaining admin.");
  }
  await db.roles.delete({ where: { id: userId } });
}

async function sendStatusEmail({
  status,
  formId,
  userId,
}: {
  status: string;
  formId: bigint;
  userId: string;
}) {
  const rendered = await renderStatusEmail({ status, formId, userId });

  if (!rendered) {
    return;
  }
  const app = await db.submissions.findFirst({
    where: {
      form_id: formId,
      user_id: userId,
    },
    include: {
      applications: true,
      users: true,
    },
  });

  if (!app) {
    console.log("Application not found");
    return;
  }
  const details = app.details ? (app.details as any) : {};
  const to = app.users.email!.toString();
  // Applicants sign in with (usually personal) Google accounts; also reach
  // the student email they gave on the form, unless it's the same address.
  const studentEmail = (details["student email"] as string | undefined)?.trim();
  const bcc = [
    // Mailgun sends bypass Google Workspace, so keep a copy in the team inbox.
    "team@ubclaunchpad.com",
    ...(studentEmail?.includes("@") &&
    studentEmail.toLowerCase() !== to.toLowerCase()
      ? [studentEmail]
      : []),
  ];

  await sendEmail({
    from: "no-reply@ubclaunchpad.com",
    fromName: "no-reply UBC Launch Pad",
    to,
    subject: rendered.subject,
    html: rendered.html,
    bcc,
  });
  if (!app.applications) {
    console.log("Application not found");
    return;
  }
  await db.applications.update({
    where: {
      id: app.applications.id,
    },
    data: {
      notified_on: new Date(),
    },
  });
}
