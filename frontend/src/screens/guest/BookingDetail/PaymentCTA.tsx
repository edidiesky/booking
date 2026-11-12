import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  onPay: (gateway: "paystack" | "flutterwave") => void;
  isPaying: boolean;
  disabled: boolean;
}

const gateways = [
  {
    id: "paystack",
    name: "Paystack",
    blurb: "Cards, bank transfer, USSD",
    icon: "/icons/paystack.svg",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    blurb: "Cards, bank, mobile money",
    icon: "/icons/flutterwave.svg",
  },
] as const;

export default function PaymentCTA({ onPay, isPaying, disabled }: Props) {
  const [gateway, setGateway] = useState<"paystack" | "flutterwave">(
    "paystack",
  );

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-8">
      <div className="flex w-full gap-3">
        {gateways.map((g) => {
          return (
            <button
              type="button"
              role="radio"
              aria-checked={gateway === g.id}
              onClick={() => setGateway(g.id)}
              className={cn(
                "flex flex-col w-full gap-1 rounded-2xl border p-4 text-left transition",
                gateway === g.id
                  ? "border-[var(--color-primary)] bg-gray-100 ring-2 ring-teal-700/20"
                  : "border-stone-200 bg-white",
              )}
            >
              <div className="flex flex-col gap-4 justify-between">
                <span>
                  <img className="w-8" src={g.icon} alt={g.name} />
                </span>
                <span className="font-medium lg:text-lg text-base">{g.name}</span>
              </div>
              <span className="text-sm text-stone-500">{g.blurb}</span>
            </button>
          );
        })}
      </div>

      <span className="text-xs lg:text-[13px]     text-[#4c4c4c]">
        All fees and charges are inclusive of taxes. Payment is processed
        securely by {gateway}.
      </span>

      <button
        disabled={disabled || isPaying}
        onClick={() => onPay(gateway)}
        className="h-14 rounded-full px-8 text-sm lg:text-base text-center text-white bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPaying ? "Redirecting to payment..." : "Pay now"}
      </button>
    </div>
  );
}
