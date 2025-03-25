import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { useForm } from 'react-hook-form';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useNotifications } from '../common/Notifications';

export const ExpenseCategoriesManager = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const { showNotification } = useNotifications();

  // Consultar datos
  const { data: groups } = useQuery({
    queryKey: ['expense-groups'],
    queryFn: API.categories.expense.groups.get,
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: API.categories.expense.categories.get,
  });

  // Mutaciones
  const createCategory = useMutation({
    mutationFn: (data) => API.categories.expense.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      reset();
      showNotification('Categoría creada exitosamente', 'success');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Error desconocido';
      showNotification(errorMessage, 'error');
    }
  });
  
  const updateCategory = useMutation({
    mutationFn: (data) => API.categories.expense.categories.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      setSelectedCategory(null);
      showNotification('Categoría actualizada exitosamente', 'success');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Error desconocido';
      showNotification(errorMessage, 'error');
    }
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => API.categories.expense.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      setDeleteCandidate(null);
      showNotification('Categoría eliminada correctamente', 'success');
    },
    onError: (error) => {
      showNotification(`Error: ${error.message}`, 'error');
    }
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Categorías de Gastos</h2>

      {/* Formulario de categoría */}
      <form 
        onSubmit={handleSubmit(data => {
          // Eliminar group_id si es una cadena vacía
          const formData = { ...data };
          if (formData.group_id === '') {
            delete formData.group_id;
          }

          selectedCategory 
            ? updateCategory.mutate({ ...formData, id: selectedCategory.id })
            : createCategory.mutate(formData);
        })}
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            {...register('name', { required: true })}
            placeholder="Nombre de categoría"
            className="p-2 border rounded"
            defaultValue={selectedCategory?.name}
          />
          
          <select
            {...register('group_id')}
            className="p-2 border rounded"
            defaultValue={selectedCategory?.group_id || ''}
          >
            <option value="">Sin grupo</option>
            {groups?.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
            >
              {selectedCategory ? 'Actualizar' : 'Agregar'}
            </button>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Listado de categorías */}
      <div className="grid gap-2">
        {categories?.map(category => {
          const group = groups?.find(g => g.id === category.group_id);
          return (
            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{category.name}</span>
                {group && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Grupo: {group.name})
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(category)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteCandidate(category)}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => deleteCategory.mutate(deleteCandidate.id)}
        title="Confirmar eliminación"
      >
        {deleteCandidate && (
          <>
            <p>¿Eliminar la categoría <strong>{deleteCandidate.name}</strong>?</p>
            <p className="text-red-600 text-sm mt-2">¡Esta acción es irreversible!</p>
          </>
        )}
      </ConfirmationModal>
    </div>
  );
};