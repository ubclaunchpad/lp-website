"use client";

import React, { useContext, useState } from "react";
import { Button } from "@/components/primitives/button";
import { userContext } from "@/lib/context/usercontext";
import { Input } from "@/components/primitives/input";
import { toast } from "sonner";
import { updateGithubUsername } from "./onboarding";

const TEXT = {
  title: "Github",
  description: "Join the GitHub organization to access the codebase.",
  githubUsername:
    "First, let's confirm your GitHub username. Only one GitHub account can be linked to you.",
  inputPlaceholder: "Enter GitHub Username",
  button: "Join Organization",
  errorMessage: "GitHub validation failed. Please try again.",
  loadingButton: "Loading...",
  successButton: "You're all set!",
  successUpdate: "Your GitHub username has been updated.",
  pendingInvite:
    "We have invited you to the organization. Please check your email to accept the invitation.",
  pendingInviteBtn: "I accepted the invite",
  inviteSuccess: "Successfully sent organization invite!",
};

export default function GithubOnboarding() {
  const { user, userMetadata } = useContext(userContext);
  const [githubSetupState, setGithubSetupState] = useState<
    "initial" | "loading" | "success" | "error"
  >("initial");
  const [isInOrg, setIsInOrg] = useState(false);
  const [verifiedGithubUsername, setVerifiedGithubUsername] = useState(false);

  const [githubUsername, setGithubUsername] = useState(
    userMetadata.member?.github_username || "",
  );

  async function handleUpdateGithubUsername() {
    if (userMetadata.member?.github_username === githubUsername) {
      setVerifiedGithubUsername(true);
    } else {
      // Update the username in the database
      updateGithubUsername(githubUsername)
        .then((result) => {
          if (result.success) {
            setVerifiedGithubUsername(true);
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

  const handleJoinOrganization = async () => {
    try {
      setGithubSetupState("loading");

      // Send organization invite directly
      const inviteRes = await fetch(
        `/api/colony/github/${githubUsername}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const inviteData = await inviteRes.json();

      if (inviteRes.ok) {
        toast.success(inviteData.message || TEXT.inviteSuccess);
        setIsInOrg(true);
        setGithubSetupState("success");
      } else {
        // Check if user is already in the organization
        // Colony reports "already a member of the <org> organization"; GitHub's
        // own wording is "already a part of this organization".
        if (
          inviteData.error &&
          /already a (member|part) of/.test(inviteData.error)
        ) {
          toast.success("You&apos;re already in the organization!");
          setIsInOrg(true);
          setGithubSetupState("success");
          return;
        }

        // Handle specific GitHub error codes
        let errorMessage = inviteData.error || "Failed to send invite";

        switch (inviteData.error_code) {
          case "user_not_found":
            errorMessage = "GitHub user not found. Please check your username.";
            break;
          case "github_permission_error":
            errorMessage =
              "Bot doesn't have permission to send invites. Please contact an administrator.";
            break;
          case "github_rate_limit":
            errorMessage =
              "GitHub rate limit exceeded. Please try again later.";
            break;
          case "github_validation_error":
            errorMessage = "Invalid request. Please contact an administrator.";
            break;
          case "connection_error":
            errorMessage =
              "Unable to connect to GitHub service. Please try again later.";
            break;
          default:
            errorMessage =
              inviteData.error || "Failed to send organization invite";
        }

        toast.error(errorMessage);
        setGithubSetupState("error");
      }
    } catch (error) {
      console.error(error);
      toast.error(TEXT.errorMessage);
      setGithubSetupState("error");
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

      <section className="flex flex-col items-start gap-4 w-full">
        <p>{TEXT.githubUsername}</p>
        <div className="flex items-center w-full  gap-4">
          <Input
            disabled={verifiedGithubUsername}
            type="text"
            placeholder={TEXT.inputPlaceholder}
            className={`p-2 flex-1 flex-shrink-0 border  border-background-500 rounded   w-full ${verifiedGithubUsername ? " border-lp-400 text-lp-400 " : "bg-background-600"}`}
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
          />
          {!verifiedGithubUsername && (
            <Button
              variant={"secondary"}
              disabled={verifiedGithubUsername}
              onClick={handleUpdateGithubUsername}
              className=" font-semibold bg-background-500 border border-background-500 w-fit rounded text-sm hover:bg-background-400"
            >
              {userMetadata.member?.github_username === githubUsername
                ? "Looks Good"
                : "Save"}
            </Button>
          )}
        </div>
      </section>

      {verifiedGithubUsername && (
        <section className="flex flex-col flex-1 items-start gap-4 w-full">
          {isInOrg && githubSetupState === "success" ? (
            <div className="flex flex-col items-center w-full gap-4">
              <p className="text-center text-lp-400 font-semibold">
                ✓ You&apos;re all set! You should now have access to the Launch Pad
                GitHub organization.
              </p>
            </div>
          ) : (
            <>
              <p>Click below to join the Launch Pad GitHub organization:</p>
              <div className="flex flex-col w-full flex-1 gap-4">
                <div className="flex flex-1 pt-4 flex-col items-center w-full gap-4">
                  <Button
                    disabled={githubSetupState === "loading"}
                    onClick={handleJoinOrganization}
                    className="p-6 gap-4 w-fit md:min-w-[350px] text-lg rounded-full"
                  >
                    {githubSetupState === "loading"
                      ? TEXT.loadingButton
                      : TEXT.button}
                  </Button>
                  {isInOrg && githubSetupState !== "success" && (
                    <p className="text-center text-neutral-400 text-sm">
                      {TEXT.pendingInvite}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
