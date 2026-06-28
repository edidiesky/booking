import React              from "react";
import ReactDOM           from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import StoreProvider      from "@/providers/StoreProvider";
import ToasterProvider    from "@/providers/ToasterProvider";
import ModalProvider      from "@/providers/ModalProvider";
import { router }         from "@/routes";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <ToasterProvider />
      <ModalProvider />
      <RouterProvider router={router} />
    </StoreProvider>
  </React.StrictMode>,
);