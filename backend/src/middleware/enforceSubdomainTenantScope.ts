import type { Request, Response, NextFunction } from "express";
import { AppError, query } from "@booking/shared";

function scopeByPropertyId(getPropertyId: (req: Request) => string | undefined) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const tenantIdFromSubdomain = req.headers["x-tenant-id"] as string | undefined;
    if (!tenantIdFromSubdomain) return next();

    const propertyId = getPropertyId(req);
    if (!propertyId) return next();

    const rows = await query<{ tenant_id: string }>(
      `SELECT tenant_id FROM properties WHERE id = $1`,
      [propertyId],
    );

    if (!rows[0] || rows[0].tenant_id !== tenantIdFromSubdomain) {
      throw AppError.notFound("Property not found.");
    }

    next();
  };
}

function scopeByRoomTypeId(getRoomTypeId: (req: Request) => string | undefined) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const tenantIdFromSubdomain = req.headers["x-tenant-id"] as string | undefined;
    if (!tenantIdFromSubdomain) return next();

    const roomTypeId = getRoomTypeId(req);
    if (!roomTypeId) return next();

    const rows = await query<{ tenant_id: string }>(
      `SELECT p.tenant_id
       FROM room_types rt
       JOIN properties p ON p.id = rt.property_id
       WHERE rt.id = $1`,
      [roomTypeId],
    );

    if (!rows[0] || rows[0].tenant_id !== tenantIdFromSubdomain) {
      throw AppError.notFound("Room type not found.");
    }

    next();
  };
}

export const enforceSubdomainTenantScope = {
  byPropertyId: scopeByPropertyId,
  byRoomTypeId: scopeByRoomTypeId,
};