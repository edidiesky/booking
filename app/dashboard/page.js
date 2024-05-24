
import getCurrentUserSession from "../actions/getCurrentUser";
import DashboardIndex from "./_components";
export default async function Home() {
    const currentUser = await getCurrentUserSession();
  return (
    <div>
      <DashboardIndex currentUser={currentUser} />
    </div>
  );
}
