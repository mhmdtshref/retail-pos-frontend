import { useAuthenticatedAxios } from '../lib/axios';

export interface ItemSearchParams {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasVariants?: boolean;
  limit?: number;
  offset?: number;
}

export interface Item {
  id: string;
  code: string;
  description: string;
  sellingPrice: number;
  stockQuantity: number;
  imageUrl?: string;
  variants?: ItemVariant[];
}

export interface ItemVariant {
  id: string;
  code: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
  imageUrl?: string;
  attributes: Record<string, string>;
}

export interface SaleItem {
  itemId: string;
  itemVariantId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  notes?: string;
}

export interface CreateSaleRequest {
  items: SaleItem[];
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  paymentStatus: 'PAID' | 'PENDING';
  notes?: string;
  customer?: {
    name: string;
    phone: string;
  };
}

export const useItemApi = () => {
  const axios = useAuthenticatedAxios();

  return {
    search: async (params: ItemSearchParams) => {
      try {
        console.log('Searching items with params:', params);
        const response = await axios.get('/items/search', { params });
        return response.data;
      } catch (error) {
        console.error('Error in itemApi.search:', error);
        throw error;
      }
    },
  };
};

export const useSaleApi = () => {
  const axios = useAuthenticatedAxios();

  return {
    create: async (data: CreateSaleRequest) => {
      try {
        console.log('Creating sale with data:', data);
        const response = await axios.post('/sales', data);
        return response.data;
      } catch (error) {
        console.error('Error in saleApi.create:', error);
        throw error;
      }
    },
  };
}; 