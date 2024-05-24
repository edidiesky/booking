import Head from "next/head";
import { Work_Sans, Bebas_Neue, Karla } from "next/font/google";
import DashboardIndex from "./_components";
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
export default async function Home() {
  return (
    <div className={`${karla.variable}`}>
      <DashboardIndex />
    </div>
  );
}
