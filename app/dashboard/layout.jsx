"use client";

import DashboardHeader from "@/components/common/dashboardHeader";
import DashboardSidebar from "@/components/common/DashboardSidebar";


export default function DashboardLayout({
  children, // will be a page or nested layout
}) {
  return (
    <section className="flex h-[100vh] bg-[#fff]">
      <DashboardSidebar />
      <div className="w-full flex flex-col gap-4">
        <DashboardHeader />
        {children}
      </div>
    </section>
  );
}
