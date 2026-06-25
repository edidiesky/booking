export default async function globalSetup(): Promise<void> {
  process.env["NODE_ENV"]         = "test";
  process.env["JWT_SECRET"]       = "test-jwt-secret-at-least-32-chars-long";
  process.env["DATABASE_URL"]     = "postgresql://postgres:password@localhost:5432/booking_test";
  process.env["REDIS_HOST"]       = "localhost";
  process.env["REDIS_PORT"]       = "6379";
  process.env["RABBITMQ_URL"]     = "amqp://guest:guest@localhost:5672";
  process.env["WEB_ORIGIN"]       = "http://localhost:3000";
  process.env["BASE_DOMAIN"]      = "localhost";
  process.env["PAYSTACK_SECRET_KEY"]      = "sk_test_fake";
  process.env["PAYSTACK_WEBHOOK_SECRET"]  = "whsec_fake";
  process.env["OTEL_ENABLED"]     = "false";
  process.env["PORT"]             = "4001";
}
