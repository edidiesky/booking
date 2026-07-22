import { User } from "@/types/api";

export default function AccountTab({ user }: { user: User }) {
  return <div className="flex flex-col gap-4"><p className="text-xs text-[#777b86]">Name: {user.firstName} {user.lastName}</p><p className="text-xs text-[#777b86]">Email: {user.email}</p></div>;
}