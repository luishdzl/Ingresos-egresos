import { useQuery } from '@tanstack/react-query';
import API from '../../api';

export const SummaryStats = () => {
  const { data, isError, error } = useQuery({
    queryKey: ['stats'],
    queryFn: () => API.stats.summary(),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 mb-8">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Ingresos</h3>
        <p className="text-2xl text-green-600">
          ${(data?.total_income || 0).toFixed(2)}
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Gastos</h3>
        <p className="text-2xl text-red-600">
          ${(data?.total_expense || 0).toFixed(2)}
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold">Balance</h3>
        <p className={`text-2xl ${(data?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${(data?.balance || 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
};