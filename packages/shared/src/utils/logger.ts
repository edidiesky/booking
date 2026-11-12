

import winston from "winston";

const { combine, timestamp, errors, json } = winston.format;

export type Logger = winston.Logger;

export function createLogger(serviceName?: string): Logger {
  const service =
    serviceName ?? process.env.SERVICE_NAME ?? process.env.npm_package_name ?? "booking-service";

  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    defaultMeta: { service },
    format: combine(errors({ stack: true }), timestamp(), json()),
    transports: [new winston.transports.Console()],
  });
}
const logger = createLogger();

export default logger
