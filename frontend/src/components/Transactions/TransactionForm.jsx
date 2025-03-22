// src/components/Transactions/TransactionForm.jsx
import { useForm, watch } from 'react-hook-form'; // Añadir watch
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import API from '../../api';
import { format } from 'date-fns';

export const TransactionForm = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: 'USD'
    }
  });
  
  const transactionType = watch('type');
  
  // Consultar categorías
  const { data: incomeCategories, isLoading: loadingIncome } = useQuery({
    queryKey: ['income-categories'],
    queryFn: API.categories.income.get,
  });
  
  const { data: expenseCategories, isLoading: loadingExpense } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: API.categories.expense.categories.get,
  });

  const mutation = useCreateTransaction();

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo Tipo primero para determinar las categorías */}
      <div>
        <label className="block text-sm font-medium">Tipo</label>
        <select
          {...register('type', { required: "Seleccione un tipo" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccione tipo</option>
          <option value="income">Ingreso</option>
          <option value="expense">Gasto</option>
        </select>
        {errors.type && <span className="text-red-500 text-sm">{errors.type.message}</span>}
      </div>

      {/* Campo Categoría dependiente del tipo */}
      <div>
        <label className="block text-sm font-medium">Categoría</label>
        <select
          {...register('category_id', { required: "Seleccione una categoría" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          disabled={!transactionType}
        >
          <option value="">{transactionType ? 'Seleccione categoría' : 'Primero seleccione tipo'}</option>
          
          {transactionType === 'income' && 
            (loadingIncome ? (
              <option disabled>Cargando categorías...</option>
            ) : (
              incomeCategories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            ))}
          
          {transactionType === 'expense' && 
            (loadingExpense ? (
              <option disabled>Cargando categorías...</option>
            ) : (
              expenseCategories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            ))}
        </select>
        {errors.category_id && <span className="text-red-500 text-sm">{errors.category_id.message}</span>}
      </div>

      {/* Campos restantes */}
      <div>
        <label className="block text-sm font-medium">Monto</label>
        <input
          type="number"
          step="0.01"
          {...register('amount', { 
            required: "Ingrese un monto",
            min: { value: 0.01, message: "Monto mínimo: 0.01" }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.amount && <span className="text-red-500 text-sm">{errors.amount.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium">Moneda</label>
        <select
          {...register('currency', { required: "Seleccione moneda" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="MXN">MXN</option>
          {/* Añadir más monedas según necesidad */}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha</label>
        <input
          type="date"
          {...register('date', { required: "Seleccione fecha" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          {...register('description')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows="3"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Guardando...' : 'Agregar Transacción'}
      </button>
    </form>
  );
};