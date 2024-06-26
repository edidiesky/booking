import "./globals.css";
import "@bitnoi.se/react-scheduler/dist/style.css";
import { Montserrat } from "next/font/google";
import StyledComponentsRegistry from "@/utils/StylesComponentsRegistry";
import SmoothScroll from "@/constants/utils/SmoothScroll";
import ToasterProvider from "./providers/ToasterProvider";
import "react-loading-skeleton/dist/skeleton.css";
import StoreProvider from "./storeProvider";
const inter = Montserrat({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Okeke Booking Platform",
  description:
    "Okeke Booking Platform built extensively using the power of Nextjs, Expresjs and Prisma",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToasterProvider />
        {/* <ModalsProvider /> */}
        <StyledComponentsRegistry>
          <SmoothScroll>
            <StoreProvider>{children}</StoreProvider>
          </SmoothScroll>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
