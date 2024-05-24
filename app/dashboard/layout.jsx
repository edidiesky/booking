
import DashboardHeader from "@/components/common/dashboardHeader";
import DashboardSidebar from "@/components/common/DashboardSidebar";
import getCurrentUserSession from "../actions/getCurrentUser";


export default async function DashboardLayout({
  children, // will be a page or nested layout
}) {
   const currentUser = await getCurrentUserSession();
  return (
    <section className="flex relative bg-[#fff]">
      <DashboardSidebar currentUser={currentUser} />
      <div className="w-full bg-[#fff] flex flex-col gap-8">
        <DashboardHeader currentUser={currentUser} />
        <div className="flex font-booking_font flex-col gap-8 w-[95%] mx-auto">
          {children}
        </div>
      </div>
    </section>
  );
}
