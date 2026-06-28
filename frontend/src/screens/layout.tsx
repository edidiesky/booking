import { Outlet }  from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-white">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}