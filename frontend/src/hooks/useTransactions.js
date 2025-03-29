// src/hooks/useTransactions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api';

export const useTransactions = (params = {}) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      try {
        const response = await API.transactions.get(params);
        return {
          data: response.data,
          pagination: response.pagination || { totalPages: 1 }
        };
      } catch (error) {
        throw new Error(error.message || 'Error al obtener transacciones');
      }
    },
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (error.message.includes(404)) return false;
      return failureCount < 2;
    }
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTransaction) => {
      const response = await API.transactions.create(newTransaction);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['stats']);
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
    }
  });
};
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => API.transactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['stats']);
    }
  });
};