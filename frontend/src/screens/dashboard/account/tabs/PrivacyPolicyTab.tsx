
export default function PrivacyPolicyTab() {
  return (
    <div className="flex flex-col gap-4 text-xs" style={{ color: "#4c4c4c" }}>
      {/* <p style={{ color: "#991b1b" }} className="bold">
        Placeholder content, replace with your actual Privacy Policy before launch.
      </p> */}
      <p>We collect account information (name, email, phone), booking history, and payment metadata necessary to operate the platform. We do not sell personal data to third parties.</p>
      <p>Payment processing is handled by our payment partners (e.g. Paystack); we do not store raw card details on our own servers.</p>
    </div>
  );
}