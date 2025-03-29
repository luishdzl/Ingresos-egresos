import { useState } from 'react';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';

export const TransactionsPage = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Historial Completo de Transacciones</h1>
      <TransactionList 
        onRowClick={setSelectedTransaction}
        showFilters={true}
        itemsPerPage={10}
      />
      
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4">Editar Transacción</h2>
            <TransactionForm 
              initialData={selectedTransaction}
              onSuccess={() => setSelectedTransaction(null)}
            />
            <button 
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              onClick={() => setSelectedTransaction(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
