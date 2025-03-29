// src/components/Users/Users.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../common/Notifications';
import API from '../../api';

const Users = () => {
  const { showNotification } = useNotifications();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    default_currency: 'USD'
  });

  // Memoizar fetchUsers con useCallback
  const fetchUsers = useCallback(async () => {
    try {
      const response = await API.users.get();
      setUsers(response);
    } catch (error) {
      console.error('Error detallado:', error.response?.data || error.message);
      showNotification(`Error: ${error.message}`, 'error');
    }
  }, [showNotification]); // Dependencias de fetchUsers

  // Actualizar useEffect para incluir fetchUsers en dependencias
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Añadir fetchUsers al array de dependencias


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'default_currency' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await API.put(`/users/${editingUser.id}`, formData);
        showNotification('Usuario actualizado exitosamente', 'success');
      } else {
        await API.post('/users', formData);
        showNotification('Usuario creado exitosamente', 'success');
      }
      fetchUsers();
      closeModal();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error procesando la solicitud', 'error');
    }
  };

  const editUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      default_currency: user.default_currency
    });
    setIsModalOpen(true);
  };

  const deleteUser = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await API.delete(`/users/${id}`);
        showNotification('Usuario eliminado exitosamente', 'success');
        fetchUsers();
      } catch (error) {
        showNotification('Error eliminando usuario', 'error');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', default_currency: 'USD' });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.default_currency}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => editUser(user)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Moneda</label>
                <input
                  type="text"
                  name="default_currency"
                  value={formData.default_currency}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded uppercase"
                  maxLength="3"
                  pattern="[A-Za-z]{3}"
                  title="Código de 3 letras (ej: USD)"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;