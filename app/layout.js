import "./globals.css";
import StyledComponentsRegistry from "@/utils/StylesComponentsRegistry";
import SmoothScroll from "@/constants/utils/SmoothScroll";
import ToasterProvider from "./providers/ToasterProvider";
import "react-loading-skeleton/dist/skeleton.css";
import StoreProvider from "./storeProvider";
export const metadata = {
  title: "Okeke Booking Platform",
  description:
    "Okeke Booking Platform built extensively using the power of Nextjs, Expresjs and Prisma",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
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
