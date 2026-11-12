import { Router } from "express";
import {
  authenticate,
  requireTenantMember,
} from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/require-permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateUploadSignatureHandler,
  GetImportHandler,
  ListImportsHandler,
  StartImportHandler,
  StreamImportHandler,
} from "./propertyImport.controller";
import { AttachRoomImagesHandler } from "./attachRoomImages.controller";
import {
  batchIdParamSchema,
  startImportSchema,
  attachRoomImagesSchema,
} from "./propertyImport.validator";

const router = Router();

router.post(
  "/upload-signature",
  authenticate,
  requireTenantMember,
  requirePermission("property", "create"),
  CreateUploadSignatureHandler,
);

router.post(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("property", "create"),
  validate(startImportSchema),
  StartImportHandler,
);

router.post(
  "/room-images",
  authenticate,
  requireTenantMember,
  requirePermission("property", "update"),
  validate(attachRoomImagesSchema),
  AttachRoomImagesHandler,
);

router.get(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("property", "read"),
  ListImportsHandler,
);

router.get(
  "/:batchId",
  authenticate,
  requireTenantMember,
  requirePermission("property", "read"),
  validate(batchIdParamSchema, "params"),
  GetImportHandler,
);

router.get("/:batchId/stream", authenticate, StreamImportHandler);

export default router;