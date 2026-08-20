import { Link } from "react-router-dom";
import {
  FaLinkedin,
  FaXTwitter,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaTiktok,
  FaApple,
  FaGooglePlay,
} from "react-icons/fa6";

const COLUMNS = [
  {
    title: "Solutions",
    links: [
      { label: "For Hosts", to: "/select-user-type" },
      { label: "For Property Managers", to: "/select-user-type" },
      { label: "For Guests", to: "/search" },
    ],
  },
  {
    title: "Add-ons",
    links: [
      { label: "Bulk Room Import", to: "/dashboard/properties" },
      { label: "Team & Roles", to: "/dashboard/roles" },
      { label: "Campaigns", to: "/dashboard/campaigns" },
      { label: "Activity Log", to: "/dashboard/activity" },
    ],
  },

  {
    title: "Product",
    links: [
      { label: "Availability Calendar", to: "/how-it-works#calendar" },
      { label: "Escrow & Payouts", to: "/how-it-works#escrow" },
      { label: "Notifications", to: "/how-it-works#notifications" },
      { label: "PDF Exports", to: "/how-it-works#exports" },
      { label: "24/7 Support", to: "/help" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Host Guide", to: "/help/hosts" },
      { label: "Blog", to: "/blog" },
      { label: "Developer Docs", to: "/docs" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Shortlets", to: "/search?propertyType=shortlet" },
      { label: "Hotels", to: "/search?propertyType=hotel" },
      { label: "Guesthouses", to: "/search?propertyType=guesthouse" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Company", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

const SOCIALS = [
  { icon: FaLinkedin, label: "LinkedIn" },
  { icon: FaXTwitter, label: "X" },
  { icon: FaInstagram, label: "Instagram" },
  { icon: FaFacebook, label: "Facebook" },
  { icon: FaYoutube, label: "YouTube" },
  { icon: FaTiktok, label: "TikTok" },
];

export default function Footer() {
  return (
    <footer className="w-full relative">
      <div
        className="rounded-b-[40px] flex flex-col items-center justify-center"
        style={{
          backgroundColor: "var(--color-primary)",
        }}
      >
        <FooterSection1 />
      </div>

      <div
        className="w-full relative h-[340px]"
        style={{
          clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)",
        }}
      >
        <div className="fixed bottom-0 h-[340px] w-full">
          <FooterSection2 />
        </div>
      </div>
    </footer>
  );
}

function FooterSection1() {
  return (
    <div className="flex w-full h-full max-w-screen-2xl flex-col items-center justify-center gap-8">
      <div className="w-full mx-auto px-6 lg:px-8 pt-16 pb-10">
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b"
          style={{ borderColor: "rgba(0,0,0,0.15)" }}
        >
          <p
            className="text-2xl bold"
            style={{ color: "var(--color-primary-foreground)" }}
          >
            How can we help?
          </p>

          <div className="flex items-center gap-6 flex-wrap">
            <Link
              to="/contact"
              className="text-xs lg:text-[13px]"
              style={{ color: "var(--color-primary-foreground)" }}
            >
              Contact us
            </Link>
            <Link
              to="/help"
              className="text-xs lg:text-[13px]"
              style={{ color: "var(--color-primary-foreground)" }}
            >
              Help center
            </Link>
            <Link
              to="/status"
              className="text-xs lg:text-[13px]"
              style={{ color: "var(--color-primary-foreground)" }}
            >
              Status
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-primary-foreground)",
                  color: "var(--color-primary)",
                }}
              >
                <Icon size={14} />
              </a>
            ))}
          </div>

          <div
            className="flex items-center gap-1.5 px-4 py-3 rounded-full"
            style={{ backgroundColor: "var(--color-primary-foreground)" }}
          >
            <FaApple size={16} style={{ color: "var(--color-primary)" }} />
            <FaGooglePlay size={14} style={{ color: "var(--color-primary)" }} />
            <span
              className="text-xs lg:text-[13px]  ml-1"
              style={{ color: "var(--color-primary)" }}
            >
              Get the app
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 py-12">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p
                className="text-xs lg:text-[13px]  uppercase tracking-wide"
                style={{ color: "rgba(0,0,0,0.5)" }}
              >
                {col.title}
              </p>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-xs lg:text-[13px]  hover:underline"
                  style={{ color: "var(--color-primary-foreground)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden w-full py-8">
        <p
          className="whitespace-nowrap bold leading-none select-none"
          style={{
            color: "var(--color-primary-foreground)",
            fontSize: "clamp(80px, 14vw, 220px)",
          }}
        >
          Book with confidence.
        </p>
      </div>
    </div>
  );
}

function FooterSection2() {
  return (
    <div className="bg-white h-full w-full flex items-center justify-center">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-10 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="flex flex-col gap-1 lg:gap-3">
            <span
              className="text-2xl lg:text-7xl bold"
              style={{ color: "var(--color-ink)" }}
            >
              pEERK
            </span>
            <p
              className="text-xs lg:text-[13px]"
              style={{ color: "var(--color-light-steel)" }}
            >
              © {new Date().getFullYear()} pEERK
            </p>
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-2 text-xs"
            style={{ color: "var(--color-muted-stone)" }}
          >
            <Link to="/cookies" className="hover:underline">
              Cookies policy
            </Link>
            <Link to="/terms/cardholder" className="hover:underline">
              Cardholder terms
            </Link>
            <Link to="/imprint" className="hover:underline">
              Imprint
            </Link>
            <Link to="/legal/modern-slavery" className="hover:underline">
              Modern slavery act statement
            </Link>
            <Link to="/trust" className="hover:underline">
              Trust center
            </Link>
            <Link to="/privacy" className="hover:underline">
              Privacy policy
            </Link>
            <Link to="/legal" className="hover:underline">
              Legal
            </Link>
          </div>
        </div>

        <p
          className="text-[10px] leading-relaxed"
          style={{ color: "var(--color-light-steel)" }}
        >
          Booking Marketplace facilitates reservations between guests and
          independent hosts. Funds are held in escrow and released to hosts on
          checkout in accordance with our terms. Booking Marketplace is not a
          party to the accommodation contract between guest and host and does
          not guarantee the condition, safety, or legality of any listed
          property.
        </p>
      </div>
    </div>
  );
}
