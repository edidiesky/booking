import { useSelector } from "react-redux";
import { Navigate }    from "react-router-dom";
import { selectAccessToken, selectCurrentUser } from "@/redux/slices/authSlice";

interface Props { children: React.ReactNode; }

export function GuestOnlyRoute({ children }: Props) {
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);

  if (!accessToken || !currentUser) return <>{children}</>;

  const { userType } = currentUser;

  if (userType === "platform:admin")      return <Navigate to="/admin"     replace />;
  if (userType.startsWith("host:"))       return <Navigate to="/dashboard" replace />;
  return <Navigate to="/" replace />;
}