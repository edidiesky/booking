
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "test-jwt-secret-for-unit-tests";
process.env.JWT_CODE = process.env.JWT_CODE ?? "test-secret";