// src/hooks/useTransactions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api';

export const useTransactions = (params) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => API.transactions.get(params),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: API.transactions.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    },
  });
};