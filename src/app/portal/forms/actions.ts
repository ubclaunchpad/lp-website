"use server";
import { render } from "@react-email/components";
import { db } from "@/db";
import {
  DEFAULT_APPLICATION_STATUS,
  FormStep,
  Obj,
} from "@/lib/types/questions";
import { Trigger } from "@/lib/types/forms";
import { getSessionUser, requireUser, isAdmin } from "@/lib/utils/auth";
import { JSONValidationToZod } from "@/lib/utils/forms/helpers";
import { sendEmail } from "@/lib/utils/forms/email";
import { SubmissionTemplate } from "@/components/forms/emailTemplates/submissionTemplate";

export async function submitApplication({
  formId,
  otherUser,
}: {
  formId: bigint;
  otherUser?: string;
}) {
  const user = await requireUser();
  // otherUser lets admins submit on behalf of an applicant (support flow);
  // regular users may only ever act as themselves.
  if (otherUser && !(await isAdmin(user.id))) {
    throw new Error("Unauthorized");
  }
  const userId = otherUser ? otherUser : user.id;
  const resPromise = db.submissions.findUnique({
    where: {
      user_id_form_id: {
        form_id: formId,
        user_id: userId,
      },
    },
  });

  const formPromise = db.forms.findUnique({
    where: {
      id: formId,
    },
  });

  const [res, form] = await Promise.all([resPromise, formPromise]);

  if (!res || !form) {
    return null;
  }

  const { isValid, errors } = validateFormAnswers({
    form: form.questions as unknown as FormStep[],
    formAnswers: res.details as Obj,
  });

  const steps = form?.questions as unknown as FormStep[];
  const triggers = steps.flatMap((step) =>
    step.config?.triggers ? step.config.triggers : [],
  ) as unknown as Trigger[];

  triggers.forEach((trigger) => {
    let shouldTrigger = false;
    const eventValues = trigger.event.values;
    const event = trigger.event.id as string;
    if (
      res.details &&
      res.details[event] &&
      (Array.isArray(res.details[event])
        ? eventValues.includes(res.details[event][0])
        : eventValues.includes(res.details[event]))
    ) {
      shouldTrigger = true;
    }
    if (!shouldTrigger) {
      return;
    }
    const promises = trigger.actions.map(async (action) => {
      if (action.type === "api") {
        const body = replaceTemplateValues(action.body, res.details);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}${action.url}`,
          {
            method: "POST",
            // headers: action.headers,
            body: JSON.stringify(body),
          },
        );
        const data = await response.json();
      }
    });
    Promise.all(promises);
  });

  function replaceTemplateValues(obj: Obj, values: Obj) {
    const newObj = { ...obj };
    Object.keys(newObj).forEach((key) => {
      if (typeof newObj[key] === "string") {
        newObj[key] = obj[key].replace(/{{(.*?)}}/g, (_, key) => values[key]);
      }
    });
    return newObj;
  }

  const updateSubmission = db.submissions.update({
    where: {
      user_id_form_id: {
        form_id: formId,
        user_id: userId,
      },
    },
    data: {
      status: "submitted",
    },
  });

  const createApplication = db.applications.create({
    data: {
      id: res.id!,
      status: DEFAULT_APPLICATION_STATUS,
      reviewer_id: null,
    },
  });

  await Promise.all([updateSubmission, createApplication]);
  const appEmail = res.details ? (res.details as Obj) : {};
  const template = await render(SubmissionTemplate({ formTitle: form.title }));
  await sendEmail({
    from: "no-reply@ubclaunchpad.com",
    fromName: "No-reply UBC Launch Pad",
    to: user.email!.toString(),
    subject: `${form.title} - Form Submitted`,
    html: template,
    cc: appEmail?.email as string,
  });
  return true;
}

export async function updateApplication({
  application,
  formId,
  otherUser,
}: {
  application: Obj;
  formId: bigint;
  otherUser?: string;
}) {
  const user = await requireUser();
  if (otherUser && !(await isAdmin(user.id))) {
    throw new Error("Unauthorized");
  }
  const userId = otherUser ? otherUser : user.id;

  const res = await db.submissions.findUnique({
    where: {
      user_id_form_id: {
        form_id: formId,
        user_id: userId,
      },
    },
  });

  const details = res?.details as unknown as any;
  await db.submissions.update({
    where: {
      user_id_form_id: {
        form_id: formId,
        user_id: userId,
      },
    },
    data: {
      details: { ...details, ...application },
    },
  });
  return res;
}

export async function getUserApplication({
  formId,
  includeApp,
}: {
  formId: bigint;
  includeApp?: boolean;
}) {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  return db.submissions.findUnique({
    where: {
      user_id_form_id: {
        form_id: formId,
        user_id: user.id,
      },
    },
    include: {
      applications: includeApp,
    },
  });
}

function validateFormAnswers({
  form,
  formAnswers,
}: {
  form: FormStep[];
  formAnswers: Obj;
}) {
  let isValid = true;
  const errors: string[] = [];
  form.forEach((step) => {
    step.questions.forEach((question) => {
      const value = formAnswers[question.id];
      const validation = JSONValidationToZod(question.config.validation);
      const result = validation.safeParse(value);
      if (!result.success) {
        isValid = false;
        console.log(`Error in ${question.id}: ${result.error.message}`);
        errors.push(result.error.message);
      }
    });
  });
  return { isValid, errors };
}

export async function startApplication({ formId }: { formId: bigint }) {
  const user = await requireUser();
  const res = await db.submissions.findUnique({
    where: {
      user_id_form_id: {
        form_id: formId,
        user_id: user.id,
      },
    },
  });
  if (res) {
    if (res.status) {
      return null;
    }
    return db.submissions.update({
      where: {
        user_id_form_id: {
          form_id: formId,
          user_id: user.id,
        },
      },
      data: {
        status: "pending",
      },
    });
  }
  return db.submissions.create({
    data: {
      user_id: user.id,
      form_id: formId,
      status: "pending",
    },
  });
}
