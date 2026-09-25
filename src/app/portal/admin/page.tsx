import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  FileText,
  UserCheck,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { getSessionUser, isAdmin } from "@/lib/utils/auth";
import { formatDate } from "@/lib/utils/dates";
import { DEFAULT_APPLICATION_STATUS } from "@/lib/types/questions";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.id))) {
    redirect("/portal");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalForms,
    activeMembers,
    pendingApplications,
    submissionsThisMonth,
    latestForm,
  ] = await Promise.all([
    db.forms.count(),
    db.members.count(),
    db.applications.count({
      where: { status: DEFAULT_APPLICATION_STATUS },
    }),
    db.submissions.count({ where: { created_at: { gte: startOfMonth } } }),
    db.forms.findFirst({
      where: { type: "recruitment" },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const sections = [
    {
      title: "Forms",
      description: "Create, edit, and launch application forms",
      href: "/portal/admin/forms",
      icon: FileText,
    },
    {
      title: "Members",
      description: "Browse and manage everyone in the organization",
      href: "/portal/admin/members",
      icon: Users,
    },
    {
      title: "Users",
      description: "Manage user roles and permissions",
      href: "/portal/admin/users",
      icon: UserCheck,
    },
    {
      title: "Analytics",
      description: "See application and member statistics",
      href: "/portal/admin/analytics",
      icon: BarChart3,
    },
  ];

  const stats = [
    { label: "Forms", value: totalForms, icon: FileText },
    { label: "Members", value: activeMembers, icon: Users },
    {
      label: "Applications to review",
      value: pendingApplications,
      icon: UserCheck,
    },
    {
      label: "Submissions this month",
      value: submissionsThisMonth,
      icon: BarChart3,
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to main site"
          className="shrink-0 rounded-full border border-transparent p-1.5 text-neutral-400 transition-colors hover:border-lp-500 hover:text-lp-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-heading text-3xl font-bold text-white">Admin</h1>
      </header>

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-background-400/60 bg-background-600 shadow-md shadow-black/20 max-lg:[&>div:nth-child(n+3)]:border-t max-lg:[&>div:nth-child(even)]:border-l lg:grid-cols-4 lg:divide-x [&>div]:border-background-400/60 lg:divide-background-400/60">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="text-sm text-neutral-300">{stat.label}</dt>
                <dd className="font-heading text-3xl font-semibold tabular-nums text-white">
                  {stat.value.toLocaleString("en-US")}
                </dd>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-lp-400/15 text-lp-300">
                <Icon size={20} aria-hidden />
              </span>
            </div>
          );
        })}
      </dl>

      {latestForm?.title && (
        <Link
          href={`/portal/admin/forms/${latestForm.id}`}
          className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg border border-lp-400/30 bg-lp-400/[0.06] px-5 py-4 transition-colors hover:border-lp-400/60 hover:bg-lp-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-400"
        >
          <div className="flex min-w-0 flex-col">
            <span className="text-sm text-neutral-400">
              Latest recruitment form
            </span>
            <span className="truncate font-heading text-lg font-medium text-white">
              {latestForm.title}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {latestForm.open_at ? (
              <span className="text-neutral-300">
                {formatDate(latestForm.open_at)} -{" "}
                {latestForm.close_at
                  ? formatDate(latestForm.close_at)
                  : "open-ended"}
              </span>
            ) : (
              <span className="text-amber-300">Not scheduled yet</span>
            )}
            <ArrowUpRight
              size={18}
              aria-hidden
              className="text-neutral-500 transition-colors group-hover:text-lp-300"
            />
          </div>
        </Link>
      )}

      <nav
        aria-label="Admin sections"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex items-start gap-4 rounded-lg border border-background-400/60 bg-background-600 p-5 shadow-md shadow-black/20 transition-colors hover:border-lp-400/60 hover:bg-background-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-400"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-lp-400/15 text-lp-300">
                <Icon size={20} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-heading text-lg font-medium text-white">
                  {section.title}
                </span>
                <span className="text-sm text-neutral-300">
                  {section.description}
                </span>
              </span>
              <ArrowUpRight
                size={18}
                aria-hidden
                className="shrink-0 text-neutral-600 transition-colors group-hover:text-lp-300"
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
