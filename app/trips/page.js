import Head from "next/head";
import HomeIndex from "./_components";
import Navbar from "@/components/common/Navbar";
export default async function Root() {
  return (
    <div className="relative">
      <HomeIndex />
    </div>
  );
}
