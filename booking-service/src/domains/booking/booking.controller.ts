import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { bookingService } from "./booking.service";

export function createBookingController(pool: Pool) {
  const id = (req: Request) => req.params.bookingId as string;
  const tenant = (req: Request) =>
    (req.body?.tenantId as string | undefined) ?? (req.header("x-tenant-id") || undefined);

  return {
    async reserve(req: Request, res: Response, next: NextFunction) {
      try {
        const key = req.header("Idempotency-Key") || undefined;
        res.status(201).json(await bookingService.reserve(pool, req.body, key));
      } catch (err) {
        next(err);
      }
    },
    async release(req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json(await bookingService.release(pool, id(req), tenant(req)));
      } catch (err) {
        next(err);
      }
    },
    async confirm(req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json(await bookingService.confirm(pool, id(req), tenant(req)));
      } catch (err) {
        next(err);
      }
    },
    async findById(req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json(await bookingService.findById(pool, id(req)));
      } catch (err) {
        next(err);
      }
    },
    async getHistory(req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json(await bookingService.getHistory(pool, id(req)));
      } catch (err) {
        next(err);
      }
    },
  };
}
