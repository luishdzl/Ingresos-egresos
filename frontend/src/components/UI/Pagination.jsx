export const Pagination = ({ currentPage, totalPages, onPageChange, limit, onLimitChange }) => {
  return (
    <div className="flex flex-wrap md:flex-row items-center justify-center gap-4 mt-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        
        <span>Página {currentPage} de {Math.max(1, totalPages || 1)}</span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <span>Mostrar:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Math.max(1, Number(e.target.value)))}
          className="p-1 border rounded"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
};