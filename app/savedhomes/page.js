import Head from "next/head";
import HomeIndex from "./_components";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import getCurrentUserSession from "../actions/getCurrentUser";
export default async function Root() {
    const currentUser = await getCurrentUserSession();
    // console.log(params)
    // const  {loading, error, room } = useGetRoomById(params?.roomid)
    return (
      <div>
        <Navbar currentUser={currentUser} />
        <HomeIndex />
        <Footer />
      </div>
    );
}
