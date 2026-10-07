import { useCallback, useEffect, useRef, useState } from "react";

import {
  getItems,
  getSelected,
  selectItem,
  unselectItem,
} from "../api/items.api";

const PAGE_SIZE = 20;

export function useItems() {
  const [items, setItems] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    abortRef.current = controller;

    Promise.all([
      getItems(
        {
          offset: 0,
          limit: PAGE_SIZE,
        },
        controller.signal,
      ),
      getSelected(controller.signal),
    ])
      .then(([itemsResponse, selectedResponse]) => {
        if (controller.signal.aborted) return;

        setItems(itemsResponse.items);
        setSelectedItems(selectedResponse);

        setHasMore(itemsResponse.hasMore);
        setOffset(itemsResponse.items.length);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError("Failed to load items");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    abortRef.current?.abort();

    const controller = new AbortController();

    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await getItems(
        {
          offset,
          limit: PAGE_SIZE,
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      setItems((prev) => [...prev, ...response.items]);

      setHasMore(response.hasMore);

      setOffset(offset + response.items.length);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setError("Failed to load items");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [loading, hasMore, offset]);

  const select = useCallback(async (id: number) => {
    try {
      await selectItem(id);

      setSelectedItems((prev) => [...prev, id]);

      setItems((prev) => prev.filter((item) => item !== id));
    } catch {
      setError("Failed to select item");
    }
  }, []);

  const unselect = useCallback(async (id: number) => {
    try {
      await unselectItem(id);

      setSelectedItems((prev) => prev.filter((item) => item !== id));

      /**
       * Пока просто возвращаем элемент.
       * Позже сделаем правильную синхронизацию
       * с backend.
       */
      setItems((prev) => [...prev, id]);
    } catch {
      setError("Failed to unselect item");
    }
  }, []);

  return {
    items,
    selectedItems,

    loading,
    error,
    hasMore,

    loadMore,
    select,
    unselect,
  };
}
