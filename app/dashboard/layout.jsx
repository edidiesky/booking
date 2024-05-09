"use client";

import DashboardBanner from "@/components/common/dashboardBanner";
import DashboardHeader from "@/components/common/dashboardHeader";
import DashboardSidebar from "@/components/common/DashboardSidebar";


export default function DashboardLayout({
  children, // will be a page or nested layout
}) {
  return (
    <section className="flex h-[100vh] bg-[#fff]">
      <DashboardSidebar />
      <div className="w-full bg-[#f7f7f7] flex flex-col gap-4">
        <DashboardHeader />
        <div className="flex flex-col gap-8 w-[95%] mx-auto">
        
          {children}
        </div>
        
      </div>
    </section>
  );
}
