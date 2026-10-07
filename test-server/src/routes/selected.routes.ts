import { Router } from "express";
import { selectedController } from "../controllers/selected.controller";

const router = Router();

router.get("/", (req, res) => selectedController.getSelected(req, res));

router.post("/", (req, res) => selectedController.select(req, res));

router.delete("/:id", (req, res) => selectedController.unselect(req, res));

export default router;
