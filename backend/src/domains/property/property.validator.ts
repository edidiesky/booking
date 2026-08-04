import Joi        from "joi";

export const createPropertySchema = Joi.object({
  name:         Joi.string().min(3).max(200).required(),
  description:  Joi.string().max(5000).optional(),
  propertyType: Joi.string().valid("shortlet", "hotel", "guesthouse").required(),
  address: Joi.object({
    street:  Joi.string().required(),
    city:    Joi.string().required(),
    state:   Joi.string().required(),
    country: Joi.string().required(),
    lat:     Joi.number().optional(),
    lng:     Joi.number().optional(),
  }).required(),
  amenities:    Joi.array().items(Joi.string()).optional(),
  images:       Joi.array().items(Joi.string().uri()).optional(),
  checkInTime:  Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  status: Joi.string().valid("active", "inactive").default("active").optional(),
});

export const createRoomTypeSchema = Joi.object({
  name:         Joi.string().min(2).max(100).required(),
  description:  Joi.string().max(2000).optional(),
  maxOccupancy: Joi.number().integer().min(1).required(),
  basePriceNgn: Joi.number().min(0).required(),
  images:       Joi.array().items(Joi.string().uri()).optional(),
  amenities:    Joi.array().items(Joi.string()).optional(),
  quantity:     Joi.number().integer().min(1).required(),
});

export const seedCalendarSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

export const blockDatesSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  block:     Joi.boolean().default(true),
});

export const updateRoomTypeSchema = Joi.object({
  name:         Joi.string().min(2).max(100).allow("").optional(),
  description:  Joi.string().max(2000).allow("").optional(),
  maxOccupancy: Joi.number().integer().min(1).allow("").optional(),
  basePriceNgn: Joi.number().min(0).allow("").optional(),
  images:       Joi.array().items(Joi.string().uri()).allow("").optional(),
  amenities:    Joi.array().items(Joi.string()).allow("").optional(),
  quantity:     Joi.number().integer().min(1).allow("").optional(),
  status:       Joi.string().valid("active", "inactive").allow("").optional(),
}).min(1);

export const updatePropertySchema = Joi.object({
  name:         Joi.string().min(3).max(200).optional(),
  description:  Joi.string().max(5000).optional(),
  amenities:    Joi.array().items(Joi.string()).optional(),
  images:       Joi.array().items(Joi.string().uri()).optional(),
  checkInTime:  Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  status:       Joi.string().valid("draft", "active", "paused", "archived").optional(),
}).min(1);