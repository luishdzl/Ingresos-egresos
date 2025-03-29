import { useState } from 'react';
import { useNotifications } from '../common/Notifications'; // Corregir la importación

export const Apoyanos = () => {
  const { showNotification } = useNotifications(); // Usar el hook correctamente
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Datos de las wallets (modifica estas direcciones con las tuyas reales)
  const wallets = [
    {
      currency: 'Bitcoin',
      symbol: 'BTC',
      address: '18F5ZyrLqUXb4jawD2NXq49QTVJeGsQWyX',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg'
    },
    {
      currency: 'Ethereum',
      symbol: 'ETH',
      address: '0x2bf3b3f3b66c23f7fa2901f8c26bc6b1c640e167',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg'
    },
    {
      currency: 'Binance',
      symbol: 'USER ID',
      address: '897074852',
      icon: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.svg'
    },
    {
      currency: 'USDT (TRC20)',
      symbol: 'USDT',
      address: 'TQf6it46pFjurfGMtEpQWYhcdbpkmrXLsq',
      icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg'
    }
  ];

  const copyToClipboard = (address, currency) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopiedAddress(currency);
        showNotification(`Dirección ${currency} copiada al portapapeles`, 'success');
        setTimeout(() => setCopiedAddress(null), 2000);
      })
      .catch(() => {
        showNotification('Error al copiar la dirección', 'error');
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">Apoya Nuestro Proyecto</h1>
        <p className="text-gray-600 mb-6">
          Tu apoyo nos ayuda a seguir mejorando y manteniendo esta plataforma.<br />
          ¡Cualquier contribución es enormemente apreciada!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wallets.map((wallet) => (
          <div 
            key={wallet.currency}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <img 
                src={wallet.icon} 
                alt={wallet.currency}
                className="w-12 h-12 mr-4 object-contain"
              />
              <div>
                <h3 className="text-xl font-semibold">{wallet.currency}</h3>
                <p className="text-gray-500">{wallet.symbol}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="font-mono text-sm break-all">
                  {wallet.address}
                </span>
                <button
                  onClick={() => copyToClipboard(wallet.address, wallet.symbol)}
                  className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 transition-colors"
                >
                  {copiedAddress === wallet.symbol ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      Copiado
                    </span>
                  ) : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Importante</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                • Asegúrate de enviar solo {wallets.map(w => w.symbol).join('/')} a estas direcciones<br />
                • Las transacciones en blockchain son irreversibles<br />
                • Verifica 3 veces la dirección antes de enviar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};