import Head from "next/head";
import { Work_Sans, Bebas_Neue, Karla } from "next/font/google";
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
import HomeIndex from "./_components";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import getCurrentUserSession from "../actions/getCurrentUser";
import useGetRoomById from "@/app/hooks/useGetRoomById";
export default async function Home({params}) {
    const currentUser = await getCurrentUserSession();
  // console.log(params)
  // const  {loading, error, room } = useGetRoomById(params?.roomid)
  return (
    <div className={`${karla.variable}`}>
      <Navbar currentUser={currentUser} />
      <HomeIndex roomid={params} />
      <Footer />
    </div>
  );
}
