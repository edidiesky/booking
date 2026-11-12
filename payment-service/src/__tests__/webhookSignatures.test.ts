import crypto from "crypto";
import {
  normalizeWebhookPayload,
  verifyWebhookSignature,
  WebhookSignatureError,
} from "../domains/payment/webhookSignatures";

function fakeReq(headers: Record<string, string>) {
  return {
    header: (name: string) => headers[name.toLowerCase()] ?? headers[name],
  } as unknown as import("express").Request;
}

describe("webhookSignatures", () => {
  const secret = "test_secret_key";

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = secret;
    process.env.FLW_SECRET_HASH = secret;
  });

  it("accepts valid Paystack HMAC-SHA512", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "abc", amount: 10000 } });
    const sig = crypto.createHmac("sha512", secret).update(body).digest("hex");
    expect(() =>
      verifyWebhookSignature(
        "paystack",
        fakeReq({ "x-paystack-signature": sig }),
        body,
      ),
    ).not.toThrow();
  });

  it("rejects invalid Paystack signature", () => {
    expect(() =>
      verifyWebhookSignature(
        "paystack",
        fakeReq({ "x-paystack-signature": "deadbeef" }),
        "{}",
      ),
    ).toThrow(WebhookSignatureError);
  });

  it("accepts Flutterwave verif-hash equality", () => {
    expect(() =>
      verifyWebhookSignature(
        "flutterwave",
        fakeReq({ "verif-hash": secret }),
        "{}",
      ),
    ).not.toThrow();
  });

  it("normalizes Paystack amount as kobo", () => {
    const n = normalizeWebhookPayload("paystack", {
      data: { reference: "r1", amount: 50000 },
    });
    expect(n.transactionId).toBe("r1");
    expect(n.amountUnit).toBe("kobo");
    expect(n.amount).toBe(50000);
  });
});
