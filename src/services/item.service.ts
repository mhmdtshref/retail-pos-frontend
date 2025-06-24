import { useAuthenticatedAxios } from '../lib/axios';
import { useCallback } from 'react';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export enum Store {
  MINI_QUEEN = 'Mini Queen',
  LARICHE = 'Lariche',
}

export interface ItemVariant {
  code: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  imageUrl?: string;
  attributes?: Record<string, any>;
  notes?: string;
}

export interface VariantDefaults {
  purchasePrice?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  imageUrl?: string;
  notes?: string;
}

export interface CreateItemRequest {
  description?: string;
  categoryId: string;
  store: Store;
  purchasePrice?: number;
  sellingPrice?: number;
  imageUrl?: string;
  notes?: string;
  variantGroups?: Record<string, string[]>;
  variantDefaults?: VariantDefaults;
}

export interface Item extends CreateItemRequest {
  id: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  variants: ItemVariant[];
  category?: {
    name: string;
  };
}

export interface SearchItemsParams {
  query?: string;
  categoryId?: string;
  store?: Store;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasVariants?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchItemsResponse {
  status: string;
  data: {
    items: Item[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CreateItemResponse {
  status: string;
  data: {
    item: Item;
  };
}

export const useItemService = () => {
  const axios = useAuthenticatedAxios();

  const createItemWithVariants = useCallback(async (data: CreateItemRequest): Promise<CreateItemResponse> => {
    const response = await axios.post('/items/with-variants', data);
    return response.data;
  }, [axios]);

  const searchItems = useCallback(async (params: SearchItemsParams): Promise<SearchItemsResponse> => {
    const response = await axios.get('/items/search', { params });
    return response.data;
  }, [axios]);

  const getCategories = async (): Promise<Category[]> => {
    const response = await axios.get('/categories');
    return response.data.data.categories;
  };

  return {
    createItemWithVariants,
    searchItems,
    getCategories,
  };
}; 