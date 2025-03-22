// src/components/Categories/ExpenseCategoriesManager.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { useForm } from 'react-hook-form';

export const ExpenseCategoriesManager = () => {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  
  // Obtener grupos y categorías
  const { data: groups } = useQuery({
    queryKey: ['expense-groups'],
    queryFn: API.categories.expense.groups.get,
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: API.categories.expense.categories.get,
  });

  // Mutaciones
  const createGroup = useMutation({
    mutationFn: API.categories.expense.groups.create,
    onSuccess: () => queryClient.invalidateQueries(['expense-groups'])
  });

  const createCategory = useMutation({
    mutationFn: API.categories.expense.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      reset();
    }
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Categorías de Gastos</h2>
      
      {/* Gestión de Grupos */}
      <div className="mb-8">
        <h3 className="font-medium mb-2">Grupos de gastos</h3>
        <form 
          onSubmit={handleSubmit(data => createGroup.mutate(data))}
          className="flex gap-4 mb-4"
        >
          <input
            {...register('name', { required: true })}
            placeholder="Nuevo grupo"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear Grupo
          </button>
        </form>
        
        <div className="flex flex-wrap gap-2">
          {groups?.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`px-4 py-2 rounded ${
                selectedGroup === group.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Gestión de Categorías */}
      {selectedGroup && (
        <div>
          <h3 className="font-medium mb-2">Subcategorías</h3>
          <form 
            onSubmit={handleSubmit(data => {
              createCategory.mutate({ ...data, group_id: selectedGroup })
            })}
            className="flex gap-4 mb-4"
          >
            <input
              {...register('name', { required: true })}
              placeholder="Nueva subcategoría"
              className="flex-1 p-2 border rounded"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Agregar
            </button>
          </form>
          
          <div className="grid gap-2">
            {categories
              ?.filter(c => c.group_id === selectedGroup)
              ?.map(category => (
                <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{category.name}</span>
                  <div className="flex gap-2">
                    <button className="text-blue-600">Editar</button>
                    <button className="text-red-600">Eliminar</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};