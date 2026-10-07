import { isExistingId, store } from "../store/store";

export class SelectedService {
  select(id: number): void {
    if (!isExistingId(id)) {
      throw new Error("ID does not exist");
    }

    if (store.selectedIds.has(id)) {
      return;
    }

    store.selectedIds.add(id);
    store.selectedOrder.push(id);
  }

  unselect(id: number): void {
    if (!store.selectedIds.has(id)) {
      return;
    }

    store.selectedIds.delete(id);

    const index = store.selectedOrder.indexOf(id);

    if (index !== -1) {
      store.selectedOrder.splice(index, 1);
    }
  }

  getSelected(): number[] {
    return [...store.selectedOrder];
  }
}

export const selectedService = new SelectedService();
