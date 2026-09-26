import { redirect } from "next/navigation";
import { isFormOpen } from "@/lib/utils/forms/helpers";
import { getFormById } from "@/lib/utils/forms/server";
import { getUserApplication } from "@/app/portal/forms/actions";
import { Form } from "@/lib/types/application";
import GenericGreeter from "@/components/layouts/genericGreeter";
import { MainResultPage } from "@/components/forms/resultPages/MainResultPage";

const OFFER_STATUSES = ["offered", "accepted", "declined", "paid"];

async function getPageData(id: string) {
  const formP = getFormById(Number(id)) as unknown as Promise<Form>;
  const appP = getUserApplication({
    formId: Number(id) as unknown as bigint,
    includeApp: true,
  });

  const [form, app] = await Promise.all([formP, appP]);

  if (!form) {
    return null;
  }

  return {
    form,
    status: app?.status,
    appStatus: app?.applications?.status,
    formStatus: isFormOpen(form),
  };
}

export default async function Page({
  params,
}: {
  params: { [key: string]: string };
}) {
  if (!params.id) {
    redirect("/portal/forms");
  }

  const pageData = await getPageData(params.id);

  if (!pageData) {
    redirect("/portal/forms");
  }

  const { form, status, formStatus, appStatus } = pageData;

  // Offers live on the application page; send applicants there so they
  // don't land on the generic "submitted" screen.
  if (appStatus && OFFER_STATUSES.includes(appStatus)) {
    redirect(`/portal/forms/${params.id}/application`);
  }

  return (
    <GenericGreeter spaceBg="scene">
      <MainResultPage status={status} form={form} formStatus={formStatus} />
    </GenericGreeter>
  );
}
