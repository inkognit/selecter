export interface GetItemsParams {
  filter?: string | undefined;
  offset: number;
  limit: number;
}

export interface GetItemsResponse {
  items: number[];
  hasMore: boolean;
}
