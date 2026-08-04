import express from "express";
import helmet from "helmet";
import cors from "cors";
import bookingRoutes from "../../../domains/booking/booking.routes";
import propertyRoutes from "../../../domains/property/property.routes";
import authRoutes from "../../../domains/auth/auth.routes";
import { errorHandler } from "../../../middleware/error-handler";

export default function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1/bookings", bookingRoutes);
  app.use("/api/v1/properties", propertyRoutes);
  app.use("/api/v1/auth", authRoutes);

  app.use(errorHandler);
  return app;
}