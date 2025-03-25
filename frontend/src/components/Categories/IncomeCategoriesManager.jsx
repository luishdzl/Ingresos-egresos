import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { useForm } from 'react-hook-form';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useNotifications } from '../common/Notifications';

export const IncomeCategoriesManager = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  
  const { 
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm();

  const [editingId, setEditingId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const { data: categories, isLoading, isError, error } = useQuery({
    queryKey: ['income-categories'],
    queryFn: API.categories.income.get,
    onError: (error) => {
      showNotification(`Error cargando categorías: ${error.message}`, 'error');
    }
  });

  const handleMutationError = (error, defaultMessage) => {
    const message = error.response?.data?.error || defaultMessage;
    showNotification(message, 'error');
  };

  const createMutation = useMutation({
    mutationFn: API.categories.income.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['income-categories']);
      reset();
      setShowForm(false);
      showNotification('Categoría creada exitosamente', 'success');
    },
    onError: (error) => handleMutationError(error, 'Error creando categoría')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => API.categories.income.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['income-categories']);
      cancelEdit();
      showNotification('Categoría actualizada exitosamente', 'success');
    },
    onError: (error) => handleMutationError(error, 'Error actualizando categoría')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.categories.income.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['income-categories']);
      showNotification('Categoría eliminada correctamente', 'success');
    },
    onError: (error) => handleMutationError(error, 'Error eliminando categoría')
  });

  const startEdit = (category) => {
    setEditingId(category.id);
    setValue('name', category.name);
    setValue('description', category.description);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset();
    if (categories?.length === 0) setShowForm(false);
  };

  const onSubmit = (data) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deleteCandidate) {
      deleteMutation.mutate(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  if (isError) return (
    <div className="text-red-500 p-4">
      Error cargando categorías: {error.response?.data?.error || error.message}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Categorías de Ingresos</h2>

      <ConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
      >
        <p>¿Estás seguro de eliminar la categoría:</p>
        <p className="font-semibold mt-2">{deleteCandidate?.name}</p>
        <p className="text-sm text-red-600 mt-2">Esta acción no se puede deshacer</p>
      </ConfirmationModal>

      {!isLoading && categories?.length === 0 && !showForm && (
        <div className="text-center py-4 mb-4 border rounded bg-gray-50">
          <p className="text-gray-600">No hay categorías registradas</p>
          <button 
            onClick={() => {
              setValue('name', '');
              setShowForm(true);
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Crear primera categoría
          </button>
        </div>
      )}

      {(showForm || editingId || categories?.length > 0) && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex flex-col gap-4">
          <input
            {...register('name', { required: 'Nombre es requerido' })}
            placeholder="Nombre de categoría"
            className="p-2 border rounded"
          />
          {errors?.name?.message && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}

          <textarea
            {...register('description')}
            placeholder="Descripción"
            className="p-2 border rounded"
            rows="3"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? 'Actualizar' : 'Agregar'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-4">Cargando categorías...</div>
      ) : (
        categories?.length > 0 && (
          <div className="grid gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(category)}
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
            ))}
          </div>
        )
      )}
    </div>
  );
};