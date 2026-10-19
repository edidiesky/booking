import { PaystackAdapter } from "../domains/payment/gateways/paystack.adapter";
import { FlutterwaveAdapter } from "../domains/payment/gateways/flutterwave.adapter";
import { paymentGateways } from "../domains/payment/gateways";

describe("payment gateway adapters", () => {
  it("registry lists paystack and flutterwave", () => {
    expect(paymentGateways.list().sort()).toEqual(["flutterwave", "paystack"]);
  });

  it("paystack normalize uses kobo and reference", () => {
    const n = new PaystackAdapter().normalizeWebhook({
      event: "charge.success",
      data: { reference: "ref_1", amount: 150000 },
    });
    expect(n.transactionId).toBe("ref_1");
    expect(n.amountUnit).toBe("kobo");
    expect(n.amount).toBe(150000);
  });

  it("flutterwave normalize uses ngn and tx_ref", () => {
    const n = new FlutterwaveAdapter().normalizeWebhook({
      status: "successful",
      data: { tx_ref: "user-1-123", amount: 1500 },
    });
    expect(n.transactionId).toBe("user-1-123");
    expect(n.amountUnit).toBe("ngn");
    expect(n.amount).toBe(1500);
  });

  it("unknown gateway throws", () => {
    expect(() =>
      paymentGateways.get("stripe" as "paystack"),
    ).toThrow(/Unknown payment gateway/);
  });
});
