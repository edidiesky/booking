import { logger } from "../../logger";
import CircuitBreaker from "opossum";
import { killSwitch } from "@booking/shared";

const breakerOptions = {
  timeout: 15_000,
  errorThresholdPercentage: 50,
  resetTimeout: 3_000,
  rollingCountTimeout: 10_000,
  volumeThreshold: 5,
};

function createBreaker<Args extends unknown[], R>(
  name: string,
  action: (...args: Args) => Promise<R>,
) {
  const breaker = new CircuitBreaker(action, breakerOptions);
  breaker.fallback(() =>
    Promise.reject(new Error(`Gateway ${name} unavailable, circuit open.`)),
  );
  breaker.on("open", () => logger.warn("circuit_breaker_state_open", { name }));
  return breaker;
}

interface GatewayProcessRequest {
  amount: number;
  callbackUrl: string;
  currency: string;
  email: string;
  phone: string;
  userId: string;
  name: string;
  metadata?: Record<string, unknown>;
}

interface GatewayResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  redirectUrl?: string;
}

async function callPaystack(req: GatewayProcessRequest): Promise<GatewayResponse> {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: req.email,
      amount: Math.round(req.amount * 100), // kobo
      callback_url: req.callbackUrl,
      metadata: req.metadata,
    }),
  });
  const body = (await res.json()) as {
    status: boolean;
    message: string;
    data?: { reference: string; authorization_url: string };
  };
  return {
    success: body.status,
    message: body.message,
    transactionId: body.data?.reference,
    redirectUrl: body.data?.authorization_url,
  };
}

async function callFlutterwave(
  req: GatewayProcessRequest,
): Promise<GatewayResponse> {
  // Single timestamp so stored transactionId matches gateway tx_ref
  const txRef = `${req.userId}-${Date.now()}`;
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: req.amount,
      currency: req.currency,
      redirect_url: req.callbackUrl,
      customer: { email: req.email },
      meta: req.metadata,
    }),
  });
  const body = (await res.json()) as {
    status: string;
    message: string;
    data?: { link: string };
  };
  return {
    success: body.status === "success",
    message: body.message,
    transactionId: txRef,
    redirectUrl: body.data?.link,
  };
}

const breakers = {
  paystack: createBreaker("paystack.process", callPaystack),
  flutterwave: createBreaker("flutterwave.process", callFlutterwave),
};

export async function processPayment(
  gateway: "paystack" | "flutterwave",
  req: GatewayProcessRequest,
): Promise<GatewayResponse> {
  if (!killSwitch.isOpen(`gateway.${gateway}`)) {
    throw Object.assign(new Error(`Gateway ${gateway} is disabled`), {
      status: 503,
    });
  }
  return breakers[gateway].fire(req);
}

export async function refundPayment(
  gateway: "paystack" | "flutterwave",
  input: { transactionId: string; amountNgn?: number },
): Promise<{ success: boolean; message: string }> {
  if (!killSwitch.isOpen(`gateway.${gateway}`)) {
    throw Object.assign(new Error(`Gateway ${gateway} is disabled`), {
      status: 503,
    });
  }

  if (gateway === "paystack") {
    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: input.transactionId,
        amount:
          input.amountNgn != null
            ? Math.round(input.amountNgn * 100)
            : undefined,
      }),
    });
    const body = (await res.json()) as { status: boolean; message: string };
    return { success: body.status === true, message: body.message };
  }

  const res = await fetch("https://api.flutterwave.com/v3/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: input.transactionId }),
  });
  const body = (await res.json()) as { status: string; message: string };
  return {
    success: body.status === "success",
    message: body.message,
  };
}
