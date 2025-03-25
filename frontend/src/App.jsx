// src/App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SummaryStats } from './components/Dashboard/SummaryStats';
import { TransactionForm } from './components/Transactions/TransactionForm';
import { TransactionList } from './components/Transactions/TransactionList';
import { IncomeCategoriesManager } from './components/Categories/IncomeCategoriesManager';
import { ExpenseCategoriesManager } from './components/Categories/ExpenseCategoriesManager';
import { NotificationProvider } from './components/common/Notifications'; 

const queryClient = new QueryClient();

const Navigation = () => {
  return (
    <nav className="mb-8 border-b pb-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="" className="text-blue-600 hover:text-blue-800">
            Inicio
          </Link>
        </li>
        <li>
          <Link to="categories/income" className="text-blue-600 hover:text-blue-800">
            Categorías Ingresos
          </Link>
        </li>
        <li>
          <Link to="categories/expense" className="text-blue-600 hover:text-blue-800">
            Categorías Gastos
          </Link>
        </li>
      </ul>
    </nav>
  );
};

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Gestor Financiero</h1>
        <Navigation />
        {children}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
            <NotificationProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SummaryStats />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              }
            />
            <Route
              path="/categories/income"
              element={<IncomeCategoriesManager />}
            />
            <Route
              path="/categories/expense"
              element={<ExpenseCategoriesManager />}
            />
          </Routes>
        </MainLayout>
      </Router>
      </NotificationProvider>
      <ReactQueryDevtools initialIsOpen={false} />


    </QueryClientProvider>
  );
}