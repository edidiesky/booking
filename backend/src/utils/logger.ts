import winston from "winston";

const logger = winston.createLogger({
  level:  process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.OTEL_SERVICE_NAME ?? "booking-platform" },
  transports:  [new winston.transports.Console()],
});

export default logger;
