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

const text = {
  rejected:
    "Unfortunately, it looks like your application was not successful this time. However, we encourage you to apply again in the future.",
};

export default async function page({
  params,
}: {
  params: { [key: string]: string };
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
  if (!app || !app.applications) {
    redirect("/portal/forms");
  }

  const userApp = app.applications;
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
      subpage = <OfferPage form={form} app={app} />;
      break;
    case "pending":
    default:
      subpage = null;
  }
  return <GenericGreeter spaceBg="scene">{subpage}</GenericGreeter>;
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
