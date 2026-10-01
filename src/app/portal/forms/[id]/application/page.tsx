import { redirect } from "next/navigation";
import {
  GenericResult,
  AcceptedResult,
  SubmittedResult,
} from "@/components/forms/resultPages";
import { getFormById } from "@/lib/utils/forms/server";
import { getUserApplication } from "@/app/portal/forms/actions";
import { Form } from "@/lib/types/application";
import GenericGreeter from "@/components/layouts/genericGreeter";
import OfferPage from "@/components/forms/applications/offerPage";
import { getSessionUser, isAdmin } from "@/lib/utils/auth";
import { db } from "@/db";

const text = {
  rejected:
    "Unfortunately, it looks like your application was not successful this time. However, we encourage you to apply again in the future.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Stand-in applicant so admins without an application can see the offer page.
const SAMPLE_OFFER = {
  applications: { id: "preview", status: "offered" },
  details: { firstName: "Applicant", role: ["Developer"] },
};

export default async function page({
  params,
  searchParams,
}: {
  params: { [key: string]: string };
  // Admins only: an application id to view as that applicant, or "sample".
  searchParams?: { applicant?: string };
}) {
  if (!params.id) {
    redirect("/portal/forms");
  }
  const formP = getFormById(Number(params.id)) as unknown as Promise<Form>;
  const appP = getUserApplication({
    formId: Number(params.id) as unknown as bigint,
    includeApp: true,
  });
  const [form, app] = await Promise.all([formP, appP]);

  if (!form) {
    redirect("/portal/forms");
  }

  // Admins get a read-only view: a chosen applicant's page via ?applicant=,
  // or a sample offer when they have no application of their own.
  const user = await getSessionUser();
  const admin = user ? await isAdmin(user.id) : false;
  const applicantId = searchParams?.applicant;
  let viewApp: any = app;
  let preview = false;
  if (admin && (applicantId || !app?.applications)) {
    preview = true;
    viewApp =
      applicantId && applicantId !== "sample"
        ? UUID.test(applicantId) &&
          (await db.submissions.findFirst({
            where: { id: applicantId, form_id: BigInt(params.id) },
            include: { applications: true },
          }))
        : SAMPLE_OFFER;
    if (!viewApp?.applications) {
      redirect(`/portal/admin/forms/${params.id}`);
    }
  }
  if (!viewApp || !viewApp.applications) {
    redirect("/portal/forms");
  }

  const userApp = viewApp.applications;
  const status = userApp.status;
  let subpage = null;

  switch (status) {
    case "submitted":
    case "rejected":
      subpage = renderTerminalPage(status, form);
      break;
    case "accepted":
    case "declined":
    case "offered":
    case "paid":
      subpage = <OfferPage form={form} app={viewApp} preview={preview} />;
      break;
    case "pending":
    default:
      subpage = null;
  }
  return (
    <GenericGreeter spaceBg="scene">
      {preview && (
        <div className="w-full max-w-3xl rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
          Admin preview
          {applicantId && applicantId !== "sample"
            ? ` of this applicant's page (status: ${status ?? "none"})`
            : " with sample data"}
          . Accept/Decline are disabled.
        </div>
      )}
      {subpage ?? (
        <p className="text-base text-neutral-300">
          This applicant&apos;s status ({status ?? "none"}) has no portal page.
        </p>
      )}
    </GenericGreeter>
  );
}

function renderTerminalPage(status: string, form: any) {
  const terminalStatus = ["rejected", "submitted"];
  if (terminalStatus.includes(status)) {
    switch (status) {
      case "submitted":
        return <SubmittedResult application={form} />;
      case "rejected":
        return <GenericResult application={form} message={text.rejected} />;
    }
  }
}
