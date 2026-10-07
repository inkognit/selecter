import { Router } from "express";
import { itemsController } from "../controllers/items.controller";

const router = Router();

router.get("/", (req, res) => itemsController.getItems(req, res));

router.post("/", (req, res) => itemsController.addItem(req, res));

export default router;
