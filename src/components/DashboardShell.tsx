"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardStats from "@/components/DashboardStats";
import DashboardCourseProgress from "@/components/DashboardCourseProgress";
import DashboardNextSchedule from "@/components/DashboardNextSchedule";
import { getInitials } from "@/lib/initials";
import type {
  CourseSummary,
  NextScheduleItem,
  PaymentSummary,
  ProgressSummary,
} from "@/lib/enrollment-types";

type DashboardShellProps = {
  userName: string;
  title?: string;
  enrollments?: CourseSummary[];
  progress?: ProgressSummary[];
  nextSessions?: NextScheduleItem[];
  sessionsThisWeek?: number;
  upcomingPayment?: PaymentSummary | null;
  hasPaid?: boolean;
  children?: React.ReactNode;
};

export default function DashboardShell({
  userName,
  title = "Dashboard",
  enrollments = [],
  progress = [],
  nextSessions = [],
  sessionsThisWeek = 0,
  upcomingPayment = null,
  hasPaid = false,
  children,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const initials = getInitials(userName);

  return (
    <main className="flex min-h-screen bg-[#F8FAFC]">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navigation bar */}
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#D6E5F3] bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0D4D85] transition-colors hover:bg-[#E5F1FC] lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <h1 className="text-[18px] font-bold text-[#073763]">{title}</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[12px] text-[#526B84]">Halo, {userName} 👋</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D4D85] text-[12px] font-bold text-white">
              {initials}
            </span>
          </div>
        </header>

        {/* Konten utama */}
        <div className="flex flex-1 flex-col gap-[18px] p-5 lg:p-8">
          {children ?? (
            <>
              <DashboardStats
                enrollments={enrollments}
                sessionsThisWeek={sessionsThisWeek}
                progress={progress}
                upcomingPayment={upcomingPayment}
                hasPaid={hasPaid}
              />
              <div className="grid gap-[18px] lg:grid-cols-2">
                <DashboardCourseProgress progress={progress} />
                <DashboardNextSchedule nextSessions={nextSessions} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}