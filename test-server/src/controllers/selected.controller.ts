import type { Request, Response } from "express";
import { z } from "zod";
import { selectedService } from "../services/selected.service";

const idSchema = z.object({
  id: z.coerce.number().int(),
});

export class SelectedController {
  getSelected(req: Request, res: Response): void {
    const items = selectedService.getSelected();

    res.json({
      items,
    });
  }

  select(req: Request, res: Response): void {
    const { id } = idSchema.parse(req.body);

    try {
      selectedService.select(id);

      res.status(201).json({
        id,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "ID does not exist") {
        res.status(404).json({
          message: "ID does not exist",
        });

        return;
      }

      throw error;
    }
  }

  unselect(req: Request, res: Response): void {
    const id = Number(req.params.id);

    selectedService.unselect(id);

    res.status(204).send();
  }
}

export const selectedController = new SelectedController();
