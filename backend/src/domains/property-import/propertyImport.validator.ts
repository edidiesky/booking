import Joi from "joi";

export const startImportSchema = Joi.object({
  filePublicId: Joi.string().max(300).required(),
  fileName: Joi.string().max(255).allow("").optional(),
});

export const batchIdParamSchema = Joi.object({
  batchId: Joi.string().guid({ version: "uuidv4" }).required(),
});

export const attachRoomImagesSchema = Joi.object({
  batchId: Joi.string().guid({ version: "uuidv4" }).optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        fileName: Joi.string().max(255).required(),
        url: Joi.string().uri().max(2000).required(),
      }),
    )
    .min(1)
    .max(100)
    .required(),
});