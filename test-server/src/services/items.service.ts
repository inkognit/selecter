import { store, isExistingId, MAX_BASE_ID } from "../store/store";
import type { GetItemsParams, GetItemsResponse } from "../types";

export class ItemsService {
  getItems(params: GetItemsParams): GetItemsResponse {
    const { filter, offset, limit } = params;

    const normalizedFilter = filter?.trim() ?? "";

    const items: number[] = [];

    let skipped = 0;

    const required = limit + 1;

    for (let id = 1; id <= MAX_BASE_ID; id++) {
      if (items.length >= required) {
        break;
      }

      if (store.selectedIds.has(id)) {
        continue;
      }

      if (normalizedFilter && !String(id).includes(normalizedFilter)) {
        continue;
      }

      if (skipped < offset) {
        skipped++;
        continue;
      }

      items.push(id);
    }

    if (items.length < required) {
      for (const id of store.customIds) {
        if (items.length >= required) {
          break;
        }

        if (store.selectedIds.has(id)) {
          continue;
        }

        if (normalizedFilter && !String(id).includes(normalizedFilter)) {
          continue;
        }

        if (skipped < offset) {
          skipped++;
          continue;
        }

        items.push(id);
      }
    }

    const hasMore = items.length > limit;

    return {
      items: items.slice(0, limit),
      hasMore,
    };
  }

  addItem(id: number): void {
    if (isExistingId(id)) {
      throw new Error("ID already exists");
    }

    store.customIds.add(id);
  }
}

export const itemsService = new ItemsService();
