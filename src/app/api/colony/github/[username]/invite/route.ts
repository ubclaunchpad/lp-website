import { NextRequest, NextResponse } from "next/server";
import { colonyHeaders } from "@/lib/utils/colony/headers";
import { getSessionUser } from "@/lib/utils/auth";
import { getMemberWithTeams, sameUsername } from "@/lib/utils/colony/member";

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getMemberWithTeams(user.id);
  if (!member) {
    return NextResponse.json(
      { error: "Only members can join the GitHub organization", error_code: "not_a_member" },
      { status: 403 },
    );
  }
  // Only the GitHub account saved on the member's own profile can be invited.
  if (!sameUsername(member.github_username, params.username)) {
    return NextResponse.json(
      {
        error: "Save this GitHub username to your profile first",
        error_code: "username_mismatch",
      },
      { status: 403 },
    );
  }
  const username = member.github_username!;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_COLONY_URL}/colony/github/${encodeURIComponent(username)}/invite`,
      {
        method: "POST",
        headers: colonyHeaders(),
      },
    );

    const responseData = await response.json();

    if (!response.ok) {
      // Handle structured error responses from the backend
      return NextResponse.json(
        {
          error: responseData.message || "Failed to send GitHub invite",
          error_code: responseData.error_code || "unknown_error",
          validation_errors: responseData.validation_errors || undefined,
        },
        { status: response.status },
      );
    }

    // For successful responses, return the structured response
    return NextResponse.json({
      message: responseData.message || "GitHub invitation sent successfully",
      username: responseData.username,
      organization: responseData.organization,
      success: true,
    });
  } catch (error: any) {
    console.error("Error sending GitHub invite:", error);

    // Check if it's a network error or JSON parsing error
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Failed to connect to GitHub service",
          error_code: "connection_error",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        error_code: "internal_error",
      },
      { status: 500 },
    );
  }
}
