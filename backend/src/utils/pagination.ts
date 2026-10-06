import Joi from "joi";
import type { PaginationMeta } from "../types";

// Caps the deepest OFFSET scan at MAX_PAGE * maxLimit rows.
const MAX_PAGE = 10_000;

export function paginationKeys(maxLimit = 100, defaultLimit = 20) {
  return {
    page: Joi.number().integer().min(1).max(MAX_PAGE).default(1),
    limit: Joi.number().integer().min(1).max(maxLimit).default(defaultLimit),
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}