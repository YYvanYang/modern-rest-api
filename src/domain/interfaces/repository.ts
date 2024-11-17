export interface BaseRepository<T, K> {
  findById(id: K): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<boolean>;
  count(filter?: FilterOptions): Promise<number>;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: SortOptions;
  filter?: FilterOptions;
  fields?: string[];
  includes?: string[];
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}