import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../utils/AppError";

type Target = "body" | "query" | "params";

export function validate(schema: Joi.ObjectSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join("."), message: d.message }));
      throw AppError.badRequest("Validation failed.", details);
    }
    req[target] = value;
    next();
  };
}
