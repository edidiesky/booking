import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

export function validateBody(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ error: "Validation failed.", details: error.details.map((d) => d.message) });
    req.body = value;
    next();
  };
}
