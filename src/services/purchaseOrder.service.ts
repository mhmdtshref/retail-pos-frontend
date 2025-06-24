import { useAuthenticatedAxios } from '../lib/axios';
import { useCallback } from 'react';

export interface PurchaseOrderItem {
  itemId: string;
  itemVariantId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface CreatePurchaseOrderRequest {
  expectedDeliveryDate?: string;
  notes?: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItemResponse {
  id: string;
  itemId: string;
  itemVariantId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  receivedQuantity: number;
  notes?: string;
  item?: {
    id: string;
    code: string;
    description?: string;
    store: string;
  };
  itemVariant?: {
    id: string;
    code: string;
    attributes: Record<string, any>;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  clerkUserId: string;
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes?: string;
  items: PurchaseOrderItemResponse[];
}

export interface CreatePurchaseOrderResponse {
  status: string;
  data: {
    purchaseOrder: PurchaseOrder;
  };
}

export interface GetPurchaseOrdersResponse {
  status: string;
  data: {
    purchaseOrders: PurchaseOrder[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const usePurchaseOrderService = () => {
  const axios = useAuthenticatedAxios();

  const createPurchaseOrder = useCallback(async (data: CreatePurchaseOrderRequest): Promise<CreatePurchaseOrderResponse> => {
    const response = await axios.post('/purchase-orders', data);
    return response.data;
  }, [axios]);

  const getPurchaseOrders = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<GetPurchaseOrdersResponse> => {
    const response = await axios.get('/purchase-orders', { params });
    return response.data;
  }, [axios]);

  const getPurchaseOrderById = useCallback(async (id: string): Promise<{ status: string; data: { purchaseOrder: PurchaseOrder } }> => {
    const response = await axios.get(`/purchase-orders/${id}`);
    return response.data;
  }, [axios]);

  const updatePurchaseOrderStatus = useCallback(async (id: string, status: string): Promise<{ status: string; data: { purchaseOrder: PurchaseOrder } }> => {
    const response = await axios.patch(`/purchase-orders/${id}/status`, { status });
    return response.data;
  }, [axios]);

  return {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrderStatus,
  };
}; 