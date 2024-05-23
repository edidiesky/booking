import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import getCurrentUserSession from "../actions/getCurrentUser";
import HomeIndex from "./_components";
// import { useRouter } from "next/navigation";
export default async function Payment() {
    const currentUser = await getCurrentUserSession();
    return (
      <div>
        <Navbar currentUser={currentUser} />
        <HomeIndex />
        <Footer />
      </div>
    );
}
