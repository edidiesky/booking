import { useSelector } from "react-redux";
import { Navigate }    from "react-router-dom";
import { selectAccessToken, selectCurrentUser } from "@/redux/slices/authSlice";

interface Props { children: React.ReactNode; }

export function HostOnlyRoute({ children }: Props) {
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);

  if (!accessToken || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.userType.startsWith("host:") && currentUser.userType !== "platform:admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}