import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { AddFavoriteHandler, RemoveFavoriteHandler, ListFavoritesHandler, ListFavoritedIdsHandler } from "./favorite.controller";

const router = Router();

router.get("/",                    authenticate, ListFavoritesHandler);
router.get("/ids",                 authenticate, ListFavoritedIdsHandler);
router.put("/:propertyId",         authenticate, AddFavoriteHandler);
router.delete("/:propertyId",      authenticate, RemoveFavoriteHandler);

export default router;