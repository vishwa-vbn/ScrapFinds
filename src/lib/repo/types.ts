import type { Item, ItemInput, Status } from '../../types/item';

export interface ListResult {
  items: Item[];
  nextCursor: number | null;
  fromCache: boolean;
}

export interface ItemsRepo {
  list(opts: { category?: string; cursor?: number }): Promise<ListResult>;
  get(id: string): Promise<Item | null>;
  // admin only
  listAll(): Promise<Item[]>;
  create(input: ItemInput): Promise<string>;
  update(id: string, input: ItemInput): Promise<void>;
  setStatus(id: string, status: Status, soldPrice?: number): Promise<void>;
  setSoldPrice(id: string, soldPrice: number | null): Promise<void>;
  remove(id: string): Promise<void>;
}
