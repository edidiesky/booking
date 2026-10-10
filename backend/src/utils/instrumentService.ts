

type MeasureFn = <TResult>(
  operation: string,
  fn: () => Promise<TResult>,
) => Promise<TResult>;

/** Keys of T whose values are async methods */
type AsyncKeys<T> = {
  [K in keyof T]: T[K] extends (...args: infer _A) => Promise<infer _R>
    ? K
    : never;
}[keyof T];

type OpMap<T> = {
  [K in AsyncKeys<T>]?: string;
};

/**
 * Clone `service` and wrap selected async methods with `measure(operation, ...)`.
 * Unlisted methods keep the same implementation.
 */
export function instrumentService<T extends object>(
  service: T,
  measure: MeasureFn,
  ops: OpMap<T>,
): T {
  const out = Object.create(
    Object.getPrototypeOf(service),
    Object.getOwnPropertyDescriptors(service),
  ) as T;

  for (const key of Object.keys(ops) as Array<AsyncKeys<T>>) {
    const operation = ops[key];
    if (!operation) continue;

    const original = service[key];
    if (typeof original !== "function") continue;

    const fn = original as (...args: never[]) => Promise<unknown>;

    Object.defineProperty(out, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: (...args: never[]) =>
        measure(operation, () => fn.apply(service, args)),
    });
  }

  return out;
}

export type { MeasureFn, OpMap, AsyncKeys };
