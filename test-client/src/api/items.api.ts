const API_URL = "http://localhost:4000";

export interface GetItemsParams {
  filter?: string;
  offset?: number;
  limit?: number;
}

export interface GetItemsResponse {
  items: number[];
  hasMore: boolean;
}

export async function getItems(
  params: GetItemsParams = {},
  signal?: AbortSignal,
): Promise<GetItemsResponse> {
  const searchParams = new URLSearchParams();

  if (params.filter) {
    searchParams.set("filter", params.filter);
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const response = await fetch(
    `${API_URL}/api/items?${searchParams.toString()}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch items");
  }

  return response.json();
}

export async function selectItem(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/selected`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error("Failed to select item");
  }
}

export async function unselectItem(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/selected/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to unselect item");
  }
}

export async function getSelected(signal?: AbortSignal): Promise<number[]> {
  const response = await fetch(`${API_URL}/api/selected`, { signal });

  if (!response.ok) {
    throw new Error("Failed to fetch selected items");
  }

  const data = await response.json();

  return data.items;
}