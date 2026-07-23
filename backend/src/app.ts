import "./utils/otel";
import "dotenv/config";
import express      from "express";
import helmet       from "helmet";
import cors         from "cors";
import cookieParser from "cookie-parser";
import morgan       from "morgan";

import { contextMiddleware, tenantMiddleware } from "./middleware/contextMiddleware";
import { NotFound, errorHandler }             from "./middleware/error-handler";
import { bookingRegistry }                    from "./utils/metrics";
import authRoutes     from "./domains/auth/auth.routes";
import tenantRoutes   from "./domains/tenant/tenant.routes";
import propertyRoutes from "./domains/property/property.routes";
import bookingRoutes  from "./domains/booking/booking.routes";
import paymentRoutes  from "./domains/payment/payment.routes";
import webhookRoutes  from "./domains/webhook/webhook.routes";
import escrowRoutes   from "./domains/escrow/escrow.routes";
import profileRoutes  from "./domains/profile/profile.routes";
import auditRoutes    from "./domains/audit/audit.routes";
import sseRouter      from "./domains/sse/sse.routes";
import roleRoutes       from "./domains/role/role.routes";
import permissionRoutes from "./domains/permission/permission.routes";
import renterRoutes from "./domains/renter/renter.routes";
import securityRoutes from "./domains/security/security.routes";
const app = express();

if (!process.env.WEB_ORIGIN) throw new Error("WEB_ORIGIN env var not set.");

app.use(helmet());
app.use(cors({ origin: [process.env.WEB_ORIGIN], credentials: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(contextMiddleware);

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "booking-platform", ts: new Date().toISOString() });
});

// Prometheus metrics
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", bookingRegistry.contentType);
  res.end(await bookingRegistry.metrics());
});

app.use("/api/v1/auth",     authRoutes);
app.use("/api/v1/webhooks", webhookRoutes);

// Tenant-scoped routes

app.use("/api/v1/renters", tenantMiddleware, renterRoutes);
app.use("/api/v1/sse",        tenantMiddleware, sseRouter);
app.use("/api/v1/tenants",    tenantMiddleware, tenantRoutes);
app.use("/api/v1/properties", tenantMiddleware, propertyRoutes);
app.use("/api/v1/bookings",   tenantMiddleware, bookingRoutes);
app.use("/api/v1/payments",   tenantMiddleware, paymentRoutes);
app.use("/api/v1/escrow",     tenantMiddleware, escrowRoutes);
app.use("/api/v1/profile",    profileRoutes);
app.use("/api/v1/security",   securityRoutes);
app.use("/api/v1/audit",      tenantMiddleware, auditRoutes);
app.use("/api/v1/roles",       tenantMiddleware, roleRoutes);
app.use("/api/v1/permissions", tenantMiddleware, permissionRoutes);

app.use(NotFound);
app.use(errorHandler);

export { app };