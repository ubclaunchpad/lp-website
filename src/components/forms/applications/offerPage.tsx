"use client";

import { GenericResult } from "@/components/forms/resultPages";
import { Form } from "@/lib/types/application";
import { Button } from "@/components/primitives/button";
import { useContext, useState } from "react";
import { lpContext } from "@/lib/context/LPContext";
import { fillFormLinks, getFormLinks } from "@/lib/utils/forms/emailVariables";

export default function OfferPage({ form, app }: { form: Form; app: any }) {
  const [reqStatus, setReqStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  // A paid member has already accepted; show them the accepted view.
  const [status, setStatus] = useState<
    "offered" | "accepted" | "declined" | "error"
  >(app.applications.status === "paid" ? "accepted" : app.applications.status);
  const applicationConfig = form.config.application;
  const page = applicationConfig.pages["offerPage"];
  const text = fillFormLinks(page.content, getFormLinks(form.config));
  const { details, ...rest } = app;
  const lpData = useContext(lpContext);
  const cleanedText = replaceTemplateValues(text, {
    general: lpData,
    app: { ...rest.applications, ...details },
  });

  async function handleDecision(decision: "accepted" | "declined") {
    setReqStatus("loading");
    const res = await fetch(`/portal/api/v1/offers/${app.applications.id}`, {
      method: "POST",
      body: JSON.stringify({ status: decision }),
    });
    if (res.ok) {
      setStatus(decision);
      setReqStatus("idle");
    } else {
      setStatus("error");
      setReqStatus("error");
    }
  }

  return (
    <>
      {(() => {
        switch (status) {
          case "error":
            return (
              <div className="text-red-500 text-lg">
                There was an error processing your request. Please try again
                later.
              </div>
            );
          case "declined":
            return (
              <div className="text-red-200  white-glow  rounded-full px-4 p-1 text-lg">
                <span className="text-white animate-pulse">
                  {"You have declined the offer :("}
                </span>
              </div>
            );
          default:
            return (
              <GenericResult
                application={form}
                message={cleanedText}
                asMarkdown
              >
                {status === "accepted" ? (
                  <div className=" flex flex-col gap-4 items-center rounded px-4 p-1 text-lg bg-transparent">
                    <span className="text-white  ">
                      You have accepted the offer! 🎉{" "}
                    </span>
                    {/* Plain anchor on purpose: a full page load re-reads the
                        member record the accept just created, which the portal
                        layout's cached user context doesn't have yet. */}
                    <a
                      className="bg-lp-500 p-2 px-4 rounded-full"
                      href="/portal/onboarding"
                    >
                      Click here to continue to the onboarding process
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {reqStatus === "loading" && (
                      <div className="text-red-200  bg-lp-500  rounded px-4 p-1 text-lg">
                        <span className="text-white  ">
                          Sending the right signal to the server...
                        </span>
                      </div>
                    )}
                    <div className="flex pt-10 flex-col lg:flex-row gap-2 w-full [&>*]:flex-1">
                      <Button
                        disabled={reqStatus === "loading"}
                        onClick={() => handleDecision("declined")}
                        variant={"secondary"}
                      >
                        I Decline
                      </Button>
                      <Button
                        onClick={() => handleDecision("accepted")}
                        disabled={reqStatus === "loading"}
                      >
                        I Accept
                      </Button>
                    </div>
                  </div>
                )}
              </GenericResult>
            );
        }
      })()}
    </>
  );
}

function replaceTemplateValues(
  text: string,
  { general, app }: { general: any; app: any },
) {
  const regex = /{{(.*?)}}/g;
  const matches = text.match(regex);
  if (!matches) {
    return text;
  }
  let newText = text;
  matches.forEach((match) => {
    const key = match.replace("{{", "").replace("}}", "");
    const multiKey = key.split(":");
    if (multiKey.length > 1) {
      const [firstKey, secondKey] = multiKey;
      if (Object.keys(app).includes(secondKey)) {
        if (app[secondKey] !== undefined) {
          if (multiKey.length > 2) {
            const thirdKey = multiKey[2];
            newText = newText.replace(
              match,
              general[firstKey][app[secondKey]][thirdKey],
            );
          } else {
            newText = newText.replace(match, general[firstKey][app[secondKey]]);
          }
        }
      }
    } else {
      if (Object.keys(app).includes(key)) {
        newText = newText.replace(match, app[key]);
      } else if (Object.keys(general).includes(key)) {
        newText = "";
      }
    }
  });
  return newText;
}
