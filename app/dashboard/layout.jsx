import DashboardHeader from "@/components/common/dashboardHeader";
import DashboardSidebar from "@/components/common/DashboardSidebar";
import getCurrentUserSession from "../actions/getCurrentUser";

export default async function DashboardLayout({
  children, // will be a page or nested layout
}) {
  const currentUser = await getCurrentUserSession();
  return (
    <section className="flex relative bg-[#f5f5f5]">
      <DashboardSidebar currentUser={currentUser} />
      <div className="w-full flex flex-col gap-8">
        <DashboardHeader currentUser={currentUser} />
        <div className="flex bg-[#f5f5f5] font-booking_font flex-col gap-8 w-full">
          <div className="w-[95%] md:w-[95%] mx-auto"> {children}</div>
        </div>
      </div>
    </section>
  );
}
