import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/dashboard/common/Header";
import Sidebar from "@/components/dashboard/common/Sidebar";
import { NAV_GROUPS } from "@/components/dashboard/common/sidebarNav";


export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      
      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar
          groups={NAV_GROUPS}
          title="Bukking"
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto">
          <Header />
          <div className="p-4 max-w-[1200px] mx-auto lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}