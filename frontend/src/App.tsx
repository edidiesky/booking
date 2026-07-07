import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";

export default function App() {
  return <RouterProvider router={router} />;
}
