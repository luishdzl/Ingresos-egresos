// src/components/Transactions/TransactionForm.jsx
import { useForm } from 'react-hook-form';
import { useCreateTransaction, useUpdateTransaction } from '../../hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import API from '../../api';
import { format } from 'date-fns';
import { ToggleSlider } from '../UI/ToggleSlider';
import { useNotifications } from '../common/Notifications';

export const TransactionForm = ({ initialData, onSuccess }) => {
  const { showNotification } = useNotifications();
  
  const { 
    register, 
    handleSubmit,
    reset,
    watch, 
    setValue,
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: initialData || {
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: 'USD',
      type: 'income',
      amount: '',
      description: '',
      category_id: ''
    }
  });

  const transactionType = watch('type');
  
  const { data: incomeCategories, isLoading: loadingIncome } = useQuery({
    queryKey: ['income-categories'],
    queryFn: API.categories.income.get,
  });

  const { data: expenseCategories, isLoading: loadingExpense } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: API.categories.expense.categories.get,
  });

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const onSubmit = async (data) => {
    try {
      if (initialData) {
        await updateMutation.mutateAsync(
          { id: initialData.id, ...data },
          {
            onSuccess: () => {
              showNotification('Transacción actualizada exitosamente!', 'success');
              onSuccess?.(); // Cierra el modal
            }
          }
        );
      }
     else {
        reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          currency: 'USD',
          type: 'income',
          description: '',
          amount: '',
          category_id: ''
        });
      }
    } catch (error) {
      showNotification(
        error.response?.data?.error || error.message || 'Error procesando la transacción',
        'error'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Tipo</label>
        <ToggleSlider
          options={[
            { value: 'income', label: 'Ingreso' },
            { value: 'expense', label: 'Gasto' }
          ]}
          defaultValue={transactionType}
          onChange={(value) => setValue('type', value, { shouldValidate: true })}
        />
        {errors.type && (
          <span className="text-red-500 text-sm">{errors.type.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Categoría</label>
        <select
          {...register('category_id', { required: "Seleccione una categoría" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 border text-gray-900 text-sm p-2.5"
          disabled={!transactionType}
        >
          <option value="">
            {transactionType ? 'Seleccione categoría' : 'Primero seleccione tipo'}
          </option>
          
          {transactionType === 'income' && (
            loadingIncome ? (
              <option disabled>Cargando categorías...</option>
            ) : (
              incomeCategories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )
          )}
          
          {transactionType === 'expense' && (
            loadingExpense ? (
              <option disabled>Cargando categorías...</option>
            ) : (
              expenseCategories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )
          )}
        </select>
        {errors.category_id && (
          <span className="text-red-500 text-sm">{errors.category_id.message}</span>
        )}
      </div>

      <div className='flex gap-2'>
        <div className='flex-1'>
          <label className="block text-sm font-medium">Monto</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { 
              required: "Ingrese un monto",
              min: { value: 0.01, message: "Monto mínimo: 0.01" },
              valueAsNumber: true,
              validate: value => value > 0 || "El monto debe ser positivo"
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 border text-gray-900 text-sm p-2.5"
          />
          {errors.amount && (
            <span className="text-red-500 text-sm">{errors.amount.message}</span>
          )}
        </div>

        <div className='w-32'>
          <label className="block text-sm font-medium">Moneda</label>
          <select
            {...register('currency', { required: "Seleccione moneda" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 border text-gray-900 text-sm p-2.5"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="MXN">MXN</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha</label>
        <input
          type="date"
          {...register('date', { required: "Seleccione fecha" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 border text-gray-900 text-sm p-2.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          {...register('description')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 border text-gray-900 text-sm p-2.5"
          rows="3"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar Transacción' : 'Agregar Transacción'}
      </button>
    </form>
  );
};