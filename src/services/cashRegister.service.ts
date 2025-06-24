import { useAuthenticatedAxios } from '../lib/axios';

export interface CashRegisterStatus {
  isOpen: boolean;
  cashRegister: CashRegister | null;
  currentBalance: number;
}

export interface CashRegister {
  id: string;
  clerkUserId: string;
  status: 'OPEN' | 'CLOSED';
  openingAmount: number;
  closingAmount: number;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  openingNotes?: string;
  closingNotes?: string;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  movements?: CashMovement[];
}

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  clerkUserId: string;
  movementType: 'SALE' | 'RETURN' | 'WITHDRAWAL' | 'DEPOSIT' | 'OPENING' | 'CLOSING' | 'ADJUSTMENT';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  previousBalance: number;
  newBalance: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenRegisterRequest {
  openingAmount: number;
  notes?: string;
}

export interface CloseRegisterRequest {
  actualAmount: number;
  notes?: string;
}

export interface DepositRequest {
  amount: number;
  notes?: string;
}

export interface WithdrawRequest {
  amount: number;
  notes?: string;
}

export interface CashRegisterHistory {
  cashRegisters: CashRegister[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useCashRegisterApi = () => {
  const axios = useAuthenticatedAxios();

  return {
    // Get current cash register status
    getStatus: async (): Promise<CashRegisterStatus> => {
      const response = await axios.get('/cash-register/status');
      return response.data.data;
    },

    // Open cash register
    open: async (data: OpenRegisterRequest): Promise<{ cashRegister: CashRegister }> => {
      const response = await axios.post('/cash-register/open', data);
      return response.data.data;
    },

    // Close cash register
    close: async (data: CloseRegisterRequest): Promise<{
      cashRegister: CashRegister;
      reconciliation: {
        expectedAmount: number;
        actualAmount: number;
        difference: number;
      };
    }> => {
      const response = await axios.post('/cash-register/close', data);
      return response.data.data;
    },

    // Deposit money
    deposit: async (data: DepositRequest): Promise<{
      message: string;
      newBalance: number;
    }> => {
      const response = await axios.post('/cash-register/deposit', data);
      return response.data.data;
    },

    // Withdraw money
    withdraw: async (data: WithdrawRequest): Promise<{
      message: string;
      newBalance: number;
    }> => {
      const response = await axios.post('/cash-register/withdraw', data);
      return response.data.data;
    },

    // Get cash register history
    getHistory: async (page = 1, limit = 10): Promise<CashRegisterHistory> => {
      const response = await axios.get('/cash-register/history', {
        params: { page, limit },
      });
      return response.data.data;
    },
  };
}; 