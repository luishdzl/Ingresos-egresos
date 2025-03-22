import { useState } from 'react'; // Añadir esta importación
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { useForm } from 'react-hook-form';

export const IncomeCategoriesManager = () => {
  const queryClient = useQueryClient();
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } // Añadir formState para acceder a los errores
  } = useForm();
  const [editingId, setEditingId] = useState(null);

  // Consultar categorías
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['income-categories'],
    queryFn: API.categories.income.get,
  });

  // Mutaciones
  const createMutation = useMutation({
    mutationFn: API.categories.income.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['income-categories']);
      reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => API.categories.income.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['income-categories']);
      cancelEdit();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.categories.income.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['income-categories']);
    }
  });


  // Manejar edición
  const startEdit = (category) => {
    setEditingId(category.id);
    setValue('name', category.name);
    setValue('description', category.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset();
  };

  // Enviar formulario
  const onSubmit = (data) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isError) return <div className="text-red-500">Error cargando categorías</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Categorías de Ingresos</h2>
      
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
            disabled={createMutation.isLoading || updateMutation.isLoading}
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

        {(createMutation.error || updateMutation.error) && (
          <div className="text-red-500 mt-2">
            Error: {createMutation.error?.message || updateMutation.error?.message}
          </div>
        )}
      </form>

      {isLoading ? (
        <div>Cargando categorías...</div>
      ) : (
        <div className="grid gap-2">
          {categories?.map(category => (
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
                  onClick={() => {
                    if (window.confirm('¿Eliminar esta categoría?')) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};