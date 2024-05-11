import Head from "next/head";
import { Work_Sans, Bebas_Neue, Karla } from "next/font/google";
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
export default function Home() {
  return (
    <div className={`${karla.variable}`}>
      {/* <Head>
        <title>Dashboard || Homes & Villas by Okeke Benneth | Book directly and save </title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="https://hopper.com/favicon.ico" />
      </Head> */}
      <h1 className="text-4xl">Stat Page</h1>
    </div>
  );
}
