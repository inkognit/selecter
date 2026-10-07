export const MAX_BASE_ID = 1_000_000;

export const store = {
  customIds: new Set<number>(),
  selectedIds: new Set<number>(),

  selectedOrder: [] as number[],
};

export const isBaseId = (id: number): boolean => id >= 1 && id <= MAX_BASE_ID;

export const isExistingId = (id: number): boolean =>
  isBaseId(id) || store.customIds.has(id);
