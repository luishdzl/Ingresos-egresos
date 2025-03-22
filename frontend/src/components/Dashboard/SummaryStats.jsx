// src/components/Dashboard/SummaryStats.jsx
import { useQuery } from '@tanstack/react-query';
import API from '../../api';

export const SummaryStats = () => {
  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: () => API.stats.summary(),
  });

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Ingresos</h3>
        <p className="text-2xl text-green-600">${data?.total_income?.toFixed(2)}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Gastos</h3>
        <p className="text-2xl text-red-600">${data?.total_expense?.toFixed(2)}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Balance</h3>
        <p className={`text-2xl ${data?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${data?.balance?.toFixed(2)}
        </p>
      </div>
    </div>
  );
};