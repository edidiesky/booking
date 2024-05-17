import { Work_Sans, Bebas_Neue, Lora } from "next/font/google";

const bebas_neue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
  weight: "400",
});

const work_sans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
import "./globals.css";
import StyledComponentsRegistry from "@/utils/StylesComponentsRegistry";
import SmoothScroll from "@/constants/utils/SmoothScroll";
import ToasterProvider from "./providers/ToasterProvider";

export const metadata = {
  title: "Okeke Booking Platform",
  description:
    "Okeke Booking Platform built extensively using the power of Nextjs, Expresjs and Prisma",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bebas_neue.variable} ${lora.variable}  ${work_sans.variable}`}
    >
      <body>
        <ToasterProvider/>
        <StyledComponentsRegistry>
          <SmoothScroll>{children}</SmoothScroll>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
