import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { useForm } from 'react-hook-form';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useNotifications } from '../common/Notifications';
import { PlusIcon } from '@heroicons/react/24/outline';

export const ExpenseCategoriesManager = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');

  // Formularios
  const categoryForm = useForm();
  const groupForm = useForm();

  // Consultar datos
  const { data: groups } = useQuery({
    queryKey: ['expense-groups'],
    queryFn: API.categories.expense.groups.get,
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: API.categories.expense.categories.get,
  });

  // Mutaciones para Categorías
  const categoryMutation = useMutation({
    mutationFn: (data) => {
      if (selectedCategory) {
        return API.categories.expense.categories.update(selectedCategory.id, data);
      }
      return API.categories.expense.categories.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      resetForms();
      showNotification(`Categoría ${selectedCategory ? 'actualizada' : 'creada'} exitosamente`, 'success');
    },
    onError: (error) => {
      showNotification(error.response?.data?.error || 'Error desconocido', 'error');
    }
  });

  // Mutaciones para Grupos
  const groupMutation = useMutation({
    mutationFn: (data) => {
      if (selectedGroup) {
        return API.categories.expense.groups.update(selectedGroup.id, data);
      }
      return API.categories.expense.groups.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-groups']);
      resetForms();
      showNotification(`Grupo ${selectedGroup ? 'actualizado' : 'creado'} exitosamente`, 'success');
    },
    onError: (error) => {
      showNotification(error.response?.data?.error || 'Error desconocido', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => 
      activeTab === 'categories' 
        ? API.categories.expense.categories.delete(id)
        : API.categories.expense.groups.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries([
        activeTab === 'categories' ? 'expense-categories' : 'expense-groups'
      ]);
      setDeleteCandidate(null);
      showNotification(`${activeTab === 'categories' ? 'Categoría' : 'Grupo'} eliminado correctamente`, 'success');
    },
    onError: (error) => {
      showNotification(error.response?.data?.error || 'Error desconocido', 'error');
    }
  });

  const resetForms = () => {
    categoryForm.reset({
      name: '',
      group_id: ''
    });
    groupForm.reset({
      name: ''
    });
    setSelectedCategory(null);
    setSelectedGroup(null);
    setShowCategoryForm(false);
    setShowGroupForm(false);
  };

  const handleCategorySubmit = (data) => {
    const formData = { ...data };
    if (formData.group_id === '') delete formData.group_id;
    categoryMutation.mutate(selectedCategory ? { ...formData, id: selectedCategory.id } : formData);
  };

  const handleGroupSubmit = (data) => {
    groupMutation.mutate(selectedGroup ? { ...data, id: selectedGroup.id } : data);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    categoryForm.reset({
      name: category.name,
      group_id: category.group_id || ''
    });
    setShowCategoryForm(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    groupForm.reset({
      name: group.name
    });
    setShowGroupForm(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Gestión de Gastos</h2>
      
      {/* Pestañas */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 ${activeTab === 'categories' ? 'border-b-2 border-blue-600' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categorías
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'groups' ? 'border-b-2 border-blue-600' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Grupos
        </button>
      </div>

      {/* Botón flotante para móviles */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <button
          onClick={() => {
            if (activeTab === 'categories') {
              resetForms();
              setShowCategoryForm(true);
            } else {
              resetForms();
              setShowGroupForm(true);
            }
          }}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Contenido de Categorías */}
      {activeTab === 'categories' && (
        <div>
          {/* Encabezado y botón para nueva categoría */}
          <div className="flex justify-between items-center mb-4">
            {(showCategoryForm || selectedCategory) && (
              <div className="border-l-4 border-blue-600 pl-3">
                <h3 className="text-lg font-semibold">
                  {selectedCategory ? 'Editando categoría' : 'Nueva categoría'}
                </h3>
              </div>
            )}
            
            {categories?.length > 0 && !showCategoryForm && !selectedCategory && (
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar categoría
              </button>
            )}
          </div>

          {/* Formulario Categorías */}
          {(showCategoryForm || selectedCategory) && (
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  {...categoryForm.register('name', { required: 'Este campo es requerido' })}
                  placeholder="Nombre de categoría"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <select
                  {...categoryForm.register('group_id')}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2 flex-1 justify-center"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {selectedCategory ? 'Actualizar' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForms}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              {categoryForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {categoryForm.formState.errors.name.message}
                </p>
              )}
            </form>
          )}

          {/* Listado Categorías */}
          {categories?.length === 0 && !showCategoryForm && (
            <div className="text-center py-4 mb-4 border rounded bg-gray-50">
              <p className="text-gray-600">No hay categorías registradas</p>
              <button 
                onClick={() => setShowCategoryForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Crear primera categoría
              </button>
            </div>
          )}

          {categories?.length > 0 && (
            <div className="grid gap-2">
              {categories?.map(category => {
                const group = groups?.find(g => g.id === category.group_id);
                return (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
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
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(category)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenido de Grupos */}
      {activeTab === 'groups' && (
        <div>
          {/* Encabezado y botón para nuevo grupo */}
          <div className="flex justify-between items-center mb-4">
            {(showGroupForm || selectedGroup) && (
              <div className="border-l-4 border-blue-600 pl-3">
                <h3 className="text-lg font-semibold">
                  {selectedGroup ? 'Editando grupo' : 'Nuevo grupo'}
                </h3>
              </div>
            )}
            
            {groups?.length > 0 && !showGroupForm && !selectedGroup && (
              <button
                onClick={() => setShowGroupForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar grupo
              </button>
            )}
          </div>

          {/* Formulario Grupos */}
          {(showGroupForm || selectedGroup) && (
            <form onSubmit={groupForm.handleSubmit(handleGroupSubmit)} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  {...groupForm.register('name', { required: 'Este campo es requerido' })}
                  placeholder="Nombre del grupo"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <div className="flex gap-2 col-span-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2 flex-1 justify-center"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {selectedGroup ? 'Actualizar' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForms}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              {groupForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {groupForm.formState.errors.name.message}
                </p>
              )}
            </form>
          )}

          {/* Listado Grupos */}
          {groups?.length === 0 && !showGroupForm && (
            <div className="text-center py-4 mb-4 border rounded bg-gray-50">
              <p className="text-gray-600">No hay grupos registrados</p>
              <button 
                onClick={() => setShowGroupForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Crear primer grupo
              </button>
            </div>
          )}

          {groups?.length > 0 && (
            <div className="grid gap-2">
              {groups?.map(group => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium">{group.name}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(group)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => deleteMutation.mutate(deleteCandidate.id)}
        title="Confirmar eliminación"
      >
        {deleteCandidate && (
          <>
            <p>¿Eliminar {activeTab === 'categories' ? 'la categoría' : 'el grupo'}</p>
            <p className="font-semibold mt-2">{deleteCandidate.name}</p>
            <p className="text-red-600 text-sm mt-2">¡Esta acción es irreversible!</p>
          </>
        )}
      </ConfirmationModal>
    </div>
  );
};