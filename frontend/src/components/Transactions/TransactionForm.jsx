// src/components/Transactions/TransactionForm.jsx
import { useForm } from 'react-hook-form'; // Importación corregida (watch viene de useForm)
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import API from '../../api';
import { format } from 'date-fns';
import { ToggleSlider } from '../UI/ToggleSlider'; // Asegurar ruta correcta
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const TransactionForm = () => {
  // Configuración de react-hook-form
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch, 
    setValue // Añadir setValue para actualizar el campo type
  } = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: 'USD',
      type: 'income' // Valor inicial requerido para el ToggleSlider
    }
  });
  
  // Observar cambios en el tipo de transacción
  const transactionType = watch('type');
  
  // Consultar categorías de ingresos
  const { 
    data: incomeCategories, 
    isLoading: loadingIncome 
  } = useQuery({
    queryKey: ['income-categories'],
    queryFn: API.categories.income.get,
  });
  
  // Consultar categorías de gastos
  const { 
    data: expenseCategories, 
    isLoading: loadingExpense 
  } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: API.categories.expense.categories.get,
  });

  // Mutación para crear transacción
  const mutation = useCreateTransaction();

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync(data);
      toast.success('Transacción agregada exitosamente!');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Sección Tipo de Transacción */}
      <div>
        <label className="block text-sm font-medium mb-2">Tipo</label>
        <ToggleSlider
          options={[
            { value: 'income', label: 'Ingreso' },
            { value: 'expense', label: 'Gasto' }
          ]}
          defaultValue={transactionType} // Usar valor del formulario
          onChange={(value) => setValue('type', value, { shouldValidate: true })}
        />
        {errors.type && (
          <span className="text-red-500 text-sm">{errors.type.message}</span>
        )}
      </div>

      {/* Sección Categoría */}
      <div>
        <label className="block text-sm font-medium">Categoría</label>
        <select
          {...register('category_id', { 
            required: "Seleccione una categoría" 
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          disabled={!transactionType}
        >
          <option value="">
            {transactionType ? 'Seleccione categoría' : 'Primero seleccione tipo'}
          </option>
          
          {/* Cargar categorías según tipo */}
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
        {errors.category_id && (
          <span className="text-red-500 text-sm">{errors.category_id.message}</span>
        )}
      </div>
      {/* Campo de monto y tipo de moneda */}
      <div className='flex'> 
      {/* Campo Monto */}
      <div className='w-64 flex-1'>
        <label className="block text-sm font-medium">Monto</label>
        <input
    type="number"
    step="0.01"
    {...register('amount', { 
      required: "Ingrese un monto",
      min: { 
        value: 0.01, 
        message: "Monto mínimo: 0.01" 
      },
      valueAsNumber: true,
      validate: (value) => value > 0 || "El monto debe ser positivo"
    })}
    onKeyPress={(e) => {
      // Bloquear caracteres no numéricos excepto punto decimal
      if (!/[0-9.]/.test(e.key)) {
        e.preventDefault();
      }
      
      // Evitar múltiples puntos
      if (e.key === '.' && e.target.value.includes('.')) {
        e.preventDefault();
      }
    }}
    onInput={(e) => {
      // Limpiar valor y asegurar positivo
      let value = e.target.value;
      value = value.replace(/[^0-9.]/g, '');
      value = value.replace(/(\..*)\./g, '$1');
      
      // Eliminar ceros iniciales
      if (value === '0') value = '';
      
      // Convertir a número y asegurar positivo
      const numericValue = Math.abs(parseFloat(value || 0));
      
      // Actualizar valor en el input
      e.target.value = numericValue > 0 ? numericValue.toFixed(2) : '';
    }}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  />
  {errors.amount && (
    <span className="text-red-500 text-sm">{errors.amount.message}</span>
  )}
      </div>

      {/* Selector de Moneda */}
      <div className='w-32 flex-1'>
        <label className="block text-sm font-medium">Moneda</label>
        <select
          {...register('currency', { required: "Seleccione moneda" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-md"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="MXN">MXN</option>
        </select>
      </div>
      </div>
      {/* Selector de Fecha */}
      <div>
        <label className="block text-sm font-medium">Fecha</label>
        <input
          type="date"
          {...register('date', { required: "Seleccione fecha" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {/* Campo Descripción */}
      <div className='shadow-md'>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          {...register('description')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows="3"
        />
      </div>

      {/* Botón de Envío */}
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