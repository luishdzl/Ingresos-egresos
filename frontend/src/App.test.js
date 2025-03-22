import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { SummaryStats } from './components/Dashboard/SummaryStats';
import { TransactionForm } from './components/Transactions/TransactionForm';
import { TransactionList } from './components/Transactions/TransactionList';
import { IncomeCategoriesManager } from './components/Categories/IncomeCategoriesManager';
import { ExpenseCategoriesManager } from './components/Categories/ExpenseCategoriesManager';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="categories/income" element={<IncomeCategoriesManager />} />
            <Route path="categories/expense" element={<ExpenseCategoriesManager />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const Layout = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Gestor Financiero</h1>
      <nav className="mb-8 border-b pb-4">
        <Link to="/" className="mr-4 text-blue-600">Inicio</Link>
        <Link to="/categories/income" className="mr-4 text-blue-600">Categorías Ingresos</Link>
        <Link to="/categories/expense" className="text-blue-600">Categorías Gastos</Link>
      </nav>
      <Outlet />
    </div>
  </div>
);

const HomePage = () => (
  <>
    <SummaryStats />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Nueva Transacción</h2>
        <TransactionForm />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Últimas Transacciones</h2>
        <TransactionList />
      </div>
    </div>
  </>
);

export default App;