import { useState } from 'react';
import { useTransactions, useCreateTransaction } from '../../hooks/useTransactions';
import { Pagination } from '../UI/Pagination';
import { format, parseISO } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';


export const TransactionList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    start_date: '',
    end_date: ''
  });
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useTransactions({
    page,
    limit,
    ...filters
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  if (isLoading) return <div className="text-center py-4">Cargando transacciones...</div>;
  if (isError) return (
    <div className="text-red-500 p-4 border rounded bg-red-50">
      Error: {error?.message || 'Error cargando transacciones'}
      <button 
        onClick={() => queryClient.refetchQueries(['transactions'])}
        className="ml-2 px-3 py-1 bg-red-100 rounded hover:bg-red-200"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          name="type"
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        
        <input
          type="date"
          name="start_date"
          onChange={handleFilterChange}
          className="p-2 border rounded"
        />
        
        <input
          type="date"
          name="end_date"
          onChange={handleFilterChange}
          className="p-2 border rounded"
        />
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data?.map(transaction => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(parseISO(transaction.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.category_name}</td>
                <td className={`px-6 py-4 whitespace-nowrap ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'} 
                  {transaction.amount.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: transaction.currency
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={page}
        totalPages={data?.pagination?.totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={setLimit}
      />
    </div>
  );
};