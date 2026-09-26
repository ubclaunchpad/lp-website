import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { getSessionUser, isAdmin } from "@/lib/utils/auth";

const newOfferSchema = z.object({
  status: z.enum(["accepted", "declined", "offered", "expired"]),
});

// Applicants may only answer an outstanding offer; any other transition is admin-only.
const APPLICANT_DECISIONS = ["accepted", "declined"];

// The applicant may accept/decline their own offer; admins may manage any.
async function ownerOrAdminGuard(applicationId: string) {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  if (await isAdmin(user.id)) {
    return { admin: true };
  }
  const application = await db.applications.findUnique({
    where: { id: applicationId },
    include: { submissions: true },
  });
  if (application?.submissions.user_id !== user.id) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 403 }),
    };
  }
  return { admin: false };
}

// Form answers are stored as either a string or a single-element array
// depending on the question type, so normalize before reading.
function firstValue(value: unknown): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === undefined || v === null || v === "" ? undefined : String(v);
}

function toInt(value: unknown): number | null {
  const n = Number(firstValue(value));
  return Number.isInteger(n) ? n : null;
}

// Admin-only guard for dormant pending_members routes
async function adminGuard() {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await ownerOrAdminGuard(params.id);
  if (guard.error) return guard.error;
  const reqBody = await request.json();
  const offerDetails = newOfferSchema.safeParse(reqBody);
  if (!offerDetails.success) {
    return NextResponse.json(
      { message: "Invalid offer details" },
      { status: 400 },
    );
  }

  const appId = params.id;

  const application = await db.applications.findUnique({
    where: {
      id: appId,
    },
    include: {
      submissions: true,
    },
  });

  if (
    !application ||
    !application.submissions ||
    !application.submissions.details
  ) {
    return NextResponse.json("Application not found", { status: 404 });
  }

  if (
    !guard.admin &&
    (application.status !== "offered" ||
      !APPLICANT_DECISIONS.includes(offerDetails.data.status))
  ) {
    return NextResponse.json(
      { message: "There is no open offer to respond to" },
      { status: 409 },
    );
  }

  try {
    const sessionUser = await getSessionUser();
    await db.$transaction(async (transaction) => {
      // Update application status
      await transaction.applications.update({
        where: { id: appId },
        data: { status: offerDetails.data.status },
      });

      await transaction.application_status_history.create({
        data: {
          application_id: appId,
          old_status: application.status ?? null,
          new_status: offerDetails.data.status,
          changed_by: sessionUser?.id ?? null,
        },
      });

      const userId = application.submissions.user_id;
      const teamId = application.team_id;
      const details = application.submissions.details as {
        [key: string]: unknown;
      };

      // If the offer is declined, return early
      if (offerDetails.data.status === "declined") {
        const body = { message: `Offer to join has been declined` };
        return NextResponse.json(JSON.stringify(body), { status: 200 });
      }

      if (offerDetails.data.status === "expired") {
        const body = { message: `Offer to join has expired` };
        return NextResponse.json(JSON.stringify(body), { status: 200 });
      }

      if (offerDetails.data.status === "offered") {
        const body = { message: `Offer to join has been offered` };
        return NextResponse.json(JSON.stringify(body), { status: 200 });
      }

      // Upsert member details
      const gradYear = toInt(details["graduationYear"]);
      const memberData = {
        first_name: firstValue(details["firstName"]) ?? "",
        last_name: firstValue(details["lastName"]) ?? "",
        faculty: firstValue(details["faculty"]) ?? "",
        specialization: firstValue(details["specialization"]) ?? "",
        year_level: toInt(details["year"] ?? details["yearLevel"]),
      };
      await transaction.members.upsert({
        where: { id: userId },
        // grad_year is NOT NULL; the application form requires it, so the
        // 0 fallback only guards against legacy submissions without one.
        create: { id: userId, grad_year: gradYear ?? 0, ...memberData },
        update: {
          ...memberData,
          ...(gradYear !== null && { grad_year: gradYear }),
        },
      });

      // Add to the assigned team; upsert so re-accepting doesn't conflict.
      if (teamId) {
        const roleName = firstValue(details["role"]);
        // team_members.role references team_role.name, so drop unknown roles
        // (e.g. "Engineer") rather than failing the whole acceptance.
        const role = roleName
          ? (
              await transaction.team_role.findUnique({
                where: { name: roleName },
              })
            )?.name ?? null
          : null;
        await transaction.team_members.upsert({
          where: {
            member_id_team_id: { member_id: userId, team_id: teamId },
          },
          create: { team_id: teamId, member_id: userId, role },
          update: { role },
        });
      }
    });

    const body = { message: `Offer to join has been created` };
    return NextResponse.json(JSON.stringify(body), { status: 200 });
  } catch (error) {
    console.error("Transaction failed:", error);
    const body = {
      message: `Failed to process the offer`,
      error: error.message,
    };
    return NextResponse.json(JSON.stringify(body), { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const unauthorized = await adminGuard();
  if (unauthorized) return unauthorized;
  const pendingOffer = await db.pending_members.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!pendingOffer) {
    return NextResponse.json("Offer not found", { status: 404 });
  }

  return NextResponse.json(JSON.stringify(pendingOffer), { status: 200 });
}

const updateOfferSchema = z.object({
  status: z.enum(["accepted", "declined", "expired"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const unauthorized = await adminGuard();
  if (unauthorized) return unauthorized;
  const pendingOffer = await db.pending_members.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!pendingOffer) {
    return NextResponse.json("Offer not found", { status: 404 });
  }

  const updateDetails = updateOfferSchema.safeParse(request.body);

  if (!updateDetails.success) {
    return NextResponse.json("Invalid update details", { status: 400 });
  }

  const updatedOffer = await db.pending_members.update({
    where: {
      id: params.id,
    },
    data: {
      ...updateDetails.data,
    },
  });

  const body = {
    message: `Offer has been updated - ${updateDetails.data.status}`,
  };

  if (updateDetails.data.status === "accepted") {
    // Add user to team and add user to members table
    await db.members.create({
      data: {
        id: pendingOffer.user_id,
      },
    });

    await db.team_members.create({
      data: {
        user_id: pendingOffer.user_id,
        team_id: pendingOffer.team_id,
      },
    });
  }

  return NextResponse.json(JSON.stringify(body), { status: 200 });
}

function camelToSnake(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
