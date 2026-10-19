import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { bookingService } from "./booking.service";

export function createBookingController(pool: Pool) {
  return {
    async reserve(req: Request, res: Response, next: NextFunction) {
      try {
        res.status(201).json(await bookingService.reserve(pool, req.body));
      } catch (err) {
        next(err);
      }
    },
    async release(req: Request, res: Response, next: NextFunction) {
      try {
        res
          .status(200)
          .json(await bookingService.release(pool, req.params.bookingId as string));
      } catch (err) {
        next(err);
      }
    },
    async confirm(req: Request, res: Response, next: NextFunction) {
      try {
        res
          .status(200)
          .json(await bookingService.confirm(pool, req.params.bookingId as string));
      } catch (err) {
        next(err);
      }
    },
    async findById(req: Request, res: Response, next: NextFunction) {
      try {
        res
          .status(200)
          .json(await bookingService.findById(pool, req.params.bookingId as string));
      } catch (err) {
        next(err);
      }
    },
    async getHistory(req: Request, res: Response, next: NextFunction) {
      try {
        res
          .status(200)
          .json(await bookingService.getHistory(pool, req.params.bookingId as string));
      } catch (err) {
        next(err);
      }
    },
  };
}
