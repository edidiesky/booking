import getCurrentUserSession from "@/app/actions/getCurrentUser";
import HomeIndex from "./_components";
// import { useRouter } from "next/navigation";
export default async function Payment() {
  // const router = useRouter();
  const currentUser = await getCurrentUserSession();
  // if (!currentUser) {
  //   // router
  //   router.push("/");
  // }
  return (
    <div>
      <HomeIndex />
    </div>
  );
}
