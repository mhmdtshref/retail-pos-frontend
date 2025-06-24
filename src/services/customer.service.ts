import { useAuthenticatedAxios } from '../lib/axios';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  currentBalance?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  notes?: string;
}

export interface SearchCustomersParams {
  query: string;
  limit?: number;
}

export interface SearchCustomersResponse {
  status: string;
  data: {
    customers: Customer[];
  };
}

export interface CreateCustomerResponse {
  status: string;
  data: {
    customer: Customer;
  };
}

export const useCustomerService = () => {
  const axios = useAuthenticatedAxios();

  const searchCustomers = async (params: SearchCustomersParams): Promise<SearchCustomersResponse> => {
    const response = await axios.get('/customers/search', { params });
    return response.data;
  };

  const createCustomer = async (data: CreateCustomerRequest): Promise<CreateCustomerResponse> => {
    const response = await axios.post('/customers', data);
    return response.data;
  };

  return {
    searchCustomers,
    createCustomer,
  };
}; 