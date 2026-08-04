export default async function globalTeardown(): Promise<void> {
  const container = (global as Record<string, unknown>)["__PG_CONTAINER__"] as { stop: () => Promise<void> } | undefined;
  await container?.stop();
}