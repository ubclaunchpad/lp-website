"use client";

import React, { useState } from "react";
import { Button } from "@/components/primitives/button";
import { toast } from "sonner";
import Link from "next/link";

const TEXT = {
  title: "Notion",
  description:
    "Join the Notion workspace to access the documentation and resources. You must have a Notion account with your UBC email!",
  notionInvite:
    "https://app.notion.com/team/cb15c003-ed84-4a93-a565-36963591e578/join",
  loadingButton: "Loading...",
  successButton: "You're all set!",
  checkJoin: "Have you joined the Notion workspace?",
  yesJoin: "Yes, I've joined!",
  noJoin: "No, I haven't joined yet.",
  button: "Join Notion Workspace",
  joined: "You're all set!",
  inital: "Click on the join button to join the Notion workspace.",
};

export default function NotionOnboarding() {
  const [state, setState] = useState<"initial" | "progress" | "success">(
    "initial",
  );

  function handleUpdateNotion(toState: "yes" | "no") {
    if (toState === "no") {
      setState("initial");
      toast.info(TEXT.inital);
    } else {
      setState("success");
      toast.success(TEXT.joined);
    }
  }

  return (
    <div className="flex  w-full flex-col items-center gap-10 h-full">
      <section className="flex flex-col items-start gap-4 w-full">
        <h1 className="text-2xl font-semibold text-left w-full font-heading ">
          {TEXT.title}
        </h1>
        <p className="text-lg text-left w-full ">{TEXT.description}</p>
      </section>

      {state === "initial" && (
        <section className="flex  justify-center items-start gap-4 w-full">
          <Link
            href={TEXT.notionInvite}
            className="text-lg text-left w-fit"
            target="_blank"
            onClick={() => setState("progress")}
          >
            <Button className="p-6 gap-4  w-fit md:min-w-[350px] f text-lg rounded-full">
              {TEXT.button}
            </Button>
          </Link>
        </section>
      )}

      {state === "progress" && (
        <section className="flex flex-col items-start gap-4 w-full">
          <p>{TEXT.checkJoin}</p>
          <div className="flex flex-1  pt-4 flex-col items-center w-full gap-4">
            <Button
              onClick={() => handleUpdateNotion("no")}
              className="p-6 gap-4  w-fit md:min-w-[350px] f text-lg rounded-full"
            >
              {TEXT.noJoin}
            </Button>
            <Button
              onClick={() => handleUpdateNotion("yes")}
              className="p-6 gap-4  w-fit md:min-w-[350px] f text-lg rounded-full"
            >
              {TEXT.yesJoin}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
