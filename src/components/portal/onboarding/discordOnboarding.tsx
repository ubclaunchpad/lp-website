"use client";

import React, { useContext, useState } from "react";
import { Button } from "@/components/primitives/button";
import { z } from "zod";
import { userContext } from "@/lib/context/usercontext";
import { Input } from "@/components/primitives/input";
import { toast } from "sonner";
import { updateDiscordUsername, updateGithubUsername } from "./onboarding";
import Link from "next/link";

const TEXT = {
  title: "Discord",
  description:
    "Join the Discord server to access the community and how teams communicate.",
  discordInvite: "https://discord.gg/xESFmWyRPs",
  joinDiscord: `First, please join our Discord server. Click to join and come back to see what roles you can add; even if you are in the server or not. You can join by clicking the link below:`,
  inputPlaceholder: "Enter Discord Username",
  button: "Join Discord Server",
  roles: "The following roles will be assigned to you:",
  loadingButton: "Loading...",
  successButton: "You're all set!",
  successUpdate: "Your Discord username has been updated.",
  errorMessage: "Discord validation failed. Please try again.",
  discordusername:
    "Now, let's confirm your Discord username. Only one Discord account can be linked to you. ",
  actionBtn: "Add Discord Roles",
};

const DiscordIntegrationSchema = z.object({
  discordUsername: z.string(),
  actions: z.object({
    roles: z.array(z.string()),
  }),
});

export default function DiscordOnboarding() {
  const { user, userMetadata } = useContext(userContext);
  const [state, setState] = useState<
    "initial" | "progress" | "loading" | "success" | "error"
  >("initial");
  const [verifiedDiscordUsername, setVerifiedDiscordUsername] = useState(false);
  const [discordUsername, setDiscordUsername] = useState(
    (userMetadata.member as any)?.discord_id || "",
  );

  function handleUpdateDiscordUsername() {
    if ((userMetadata.member as any)?.discord_id === discordUsername) {
      setVerifiedDiscordUsername(true);
    } else {
      updateDiscordUsername(discordUsername)
        .then((result) => {
          if (result.success) {
            setVerifiedDiscordUsername(true);
            toast.success(TEXT.successUpdate);
          } else {
            // Handle specific error types
            if (result.errorType === "USERNAME_TAKEN") {
              toast.error(`${result.error}. Please use a different username.`);
            } else {
              toast.error(result.error || TEXT.errorMessage);
            }
          }
        })
        .catch((error) => {
          console.error("Unexpected error:", error);
          toast.error(TEXT.errorMessage);
        });
    }
  }
  const handleGithubSubmit = async () => {
    try {
      // Must match the Discord role labels exactly; Colony skips unknown names.
      const roles: string[] = ["2026-2027 Member", "Member"];
      if (!userMetadata.member?.team_members) {
        console.error("No team members found");
        return;
      }
      console.log(userMetadata.member?.team_members);
      for (const member of userMetadata.member?.team_members) {
        roles.push(...((member as any).teams.meta?.discord?.roles ?? []));
      }

      const parsed = DiscordIntegrationSchema.safeParse({
        discordUsername: discordUsername,
        actions: {
          roles: roles,
        },
      });

      if (!parsed.success) {
        return;
      }
      const response = await fetch(
        `/api/colony/discord/${discordUsername}/roles`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roles: parsed.data.actions.roles,
          }),
        },
      );

      const responseData = await response.json();
      if (!response.ok) {
        // Handle specific error codes with better user messages
        let errorMessage = responseData.error || "An error occurred";

        switch (responseData.error_code) {
          case "user_not_found":
            errorMessage =
              "Discord user not found. Please make sure you've joined the Discord server first.";
            break;
          case "bot_not_ready":
            errorMessage =
              "Discord bot is not ready. Please try again in a few moments.";
            break;
          case "validation_error":
            errorMessage =
              "Invalid roles configuration. Please contact an administrator.";
            break;
          case "discord_permission_error":
            errorMessage =
              "Bot doesn't have permission to assign roles. Please contact an administrator.";
            break;
          case "not_implemented":
            errorMessage = "This feature is not yet available.";
            break;
          case "connection_error":
            errorMessage =
              "Unable to connect to Discord service. Please try again later.";
            break;
          default:
            errorMessage =
              responseData.error || "Failed to update Discord roles";
        }

        toast.error(errorMessage);
        setState("error");
      } else {
        const successMessage =
          responseData.message || "Discord roles updated successfully!";
        toast.success(successMessage);

        // Show additional info if available
        if (responseData.roles_added && responseData.roles_added.length > 0) {
          toast.success(`Added roles: ${responseData.roles_added.join(", ")}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(TEXT.errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 h-full">
      <section className="flex flex-col items-start gap-4 w-full">
        <h1 className="text-2xl font-semibold text-left w-full font-heading ">
          {TEXT.title}
        </h1>
        <p className="text-lg text-left w-full ">{TEXT.description}</p>
      </section>

      {state === "initial" && (
        <section className="flex flex-col items-start gap-4 w-full">
          <p>{TEXT.joinDiscord}</p>
          <section className="flex  justify-center items-start gap-4 w-full">
            <Link
              href={TEXT.discordInvite}
              className="text-lg text-left w-fit"
              target="_blank"
              onClick={() => setState("progress")}
            >
              <Button className="p-6 gap-4  w-fit md:min-w-[350px] f text-lg rounded-full">
                {TEXT.button}
              </Button>
            </Link>
          </section>
        </section>
      )}

      {state === "progress" && (
        <section className="flex flex-col items-start gap-4 w-full">
          <p>{TEXT.discordusername}</p>
          <div className="flex items-center w-full gap-2 gap-4">
            <Input
              disabled={verifiedDiscordUsername}
              type="text"
              placeholder="Enter Discord Username"
              className={`p-2 flex-1 flex-shrink-0 border  border-background-500 rounded   w-full ${verifiedDiscordUsername ? " border-lp-400 text-lp-400 " : "bg-background-600"}`}
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
            />
            {!verifiedDiscordUsername && (
              <Button
                variant={"secondary"}
                disabled={verifiedDiscordUsername}
                onClick={handleUpdateDiscordUsername}
                className=" font-semibold bg-background-500 border border-background-500 w-fit rounded text-sm hover:bg-background-400"
              >
                {userMetadata.member?.discord_id === discordUsername
                  ? "Looks Good"
                  : "Save"}
              </Button>
            )}
          </div>
        </section>
      )}

      {verifiedDiscordUsername && (
        <section className="flex flex-col flex-1 items-start gap-4 w-full">
          <p>{TEXT.roles}</p>
          <div className="flex flex-col w-full flex-1  gap-4">
            <ul className="flex flex-wrap gap-2">
              {userMetadata.member?.team_members &&
                userMetadata.member.team_members.map((member) => {
                  const roles: string[] = [
                    ...(member.teams.meta?.discord?.roles ?? []),
                  ];

                  return roles.map((role) => (
                    <li
                      key={role}
                      className="border border-lp-300 bg-background-600 p-1 text-sm rounded-full w-fit px-4"
                    >
                      {role}
                    </li>
                  ));
                })}
            </ul>
            <div className="flex flex-1  pt-4 flex-col items-center w-full gap-4">
              <Button
                disabled={state === "loading" || state === "success"}
                onClick={handleGithubSubmit}
                className="p-6 gap-4  w-fit md:min-w-[350px] f text-lg rounded-full"
              >
                {state === "loading"
                  ? TEXT.loadingButton
                  : state === "success"
                    ? TEXT.successButton
                    : TEXT.actionBtn}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
