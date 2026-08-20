import { useState } from "react";

interface Props {
  onPay:     (gateway: "paystack" | "flutterwave") => void;
  isPaying:  boolean;
  disabled:  boolean;
}

export default function PaymentCTA({ onPay, isPaying, disabled }: Props) {
  const [gateway, setGateway] = useState<"paystack" | "flutterwave">("paystack");

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-8">
      <div className="flex gap-3">
        {(["paystack", "flutterwave"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGateway(g)}
            className={`w-40 h-11 border rounded-full text-xs lg:text-[13px]capitalize transition-colors ${
              gateway === g ? "border-[#17191c] bg-[#17191c] text-white" : "border-[#e8e6e3] text-[#4c4c4c]"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <span className="text-xs lg:text-[13px]  text-[#4c4c4c]">
        All fees and charges are inclusive of taxes. Payment is processed securely by {gateway}.
      </span>

      <button
        disabled={disabled || isPaying}
        onClick={() => onPay(gateway)}
        className="h-12 rounded-full px-8 text-xs lg:text-[13px]  uppercase text-center text-white bg-[#17191c] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPaying ? "Redirecting to payment..." : "Pay now"}
      </button>
    </div>
  );
}