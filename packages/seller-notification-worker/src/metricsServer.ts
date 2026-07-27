
import http from "http";
import { bookingRegistry, logger } from "@booking/shared";

const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9101);

export function startMetricsServer(): void {
  const server = http.createServer(async (req, res) => {
    if (req.url !== "/metrics") {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader("Content-Type", bookingRegistry.contentType);
    res.end(await bookingRegistry.metrics());
  });

  server.listen(METRICS_PORT, () => {
    logger.info("availability_worker_metrics_server_started", { event: "availability_worker_metrics_server_started", port: METRICS_PORT });
  });
}