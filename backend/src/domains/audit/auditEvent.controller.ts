import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { auditEventRepository } from "./auditEvent.repository";
import { AppError } from "../../utils/AppError";
import type {
  AuditEventFilters,
  Outcome,
  ActorType,
} from "./auditEvent.repository";
import { buildPaginationMeta } from "../../utils/pagination";

export const ListAuditEventsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

    const q = req.query as unknown as {
      page: number;
      limit: number;
      actor?: string;
      actorType?: ActorType;
      action?: string;
      outcome?: Outcome;
      affectedUser?: string;
      targetType?: string;
      targetId?: string;
      changedField?: string;
      requestId?: string;
      occurredAfter?: string;
      occurredBefore?: string;
    };

    const filters: AuditEventFilters = {
      tenantId: req.tenantId,
      actor: q.actor,
      actorType: q.actorType,
      action: q.action,
      outcome: q.outcome,
      affectedUser: q.affectedUser,
      targetType: q.targetType,
      targetId: q.targetId,
      changedField: q.changedField,
      requestId: q.requestId,
      occurredAfter: q.occurredAfter ? new Date(q.occurredAfter) : undefined,
      occurredBefore: q.occurredBefore ? new Date(q.occurredBefore) : undefined,
    };

    const [events, total] = await Promise.all([
      auditEventRepository.list(filters, q.page, q.limit),
      auditEventRepository.count(filters),
    ]);
    res.json({
      success: true,
      data: events,
      meta: buildPaginationMeta(q.page, q.limit, total),
    });
  },
);

export const GetAuditEventHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

    const event = await auditEventRepository.getById(
      req.params["id"] as string,
      req.tenantId,
    );
    if (!event) throw AppError.notFound("Audit event not found.");
    res.json({ success: true, data: event });
  },
);
