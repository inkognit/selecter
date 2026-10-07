import type { Request, Response } from "express";
import { z } from "zod";
import { itemsService } from "../services/items.service";

const getItemsQuerySchema = z.object({
  filter: z.string().optional(),

  offset: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().min(1).max(20).default(20),
});

const addItemBodySchema = z.object({
  id: z.number().int(),
});

export class ItemsController {
  getItems(req: Request, res: Response): void {
    const query = getItemsQuerySchema.parse(req.query);

    const result = itemsService.getItems(query);

    res.json(result);
  }

  addItem(req: Request, res: Response): void {
    const body = addItemBodySchema.parse(req.body);

    try {
      itemsService.addItem(body.id);

      res.status(201).json({
        id: body.id,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "ID already exists") {
        res.status(409).json({
          message: "ID already exists",
        });

        return;
      }

      throw error;
    }
  }
}

export const itemsController = new ItemsController();
