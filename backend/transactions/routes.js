const { body, query, validationResult } = require('express-validator');

const transactionValidations = [
  body('type').isIn(['income', 'expense']).withMessage('Tipo de transacción inválido'),
  body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('La moneda debe tener 3 caracteres'),
  body('category_id').isInt({ gt: 0 }).withMessage('ID de categoría inválido'),
  body('date').isISO8601().withMessage('Formato de fecha inválido (ISO 8601 requerido)'),
  body('description').optional().isString().trim().escape()
];

const buildTransactionsQuery = (queryParams) => {
  let baseQuery = `
    SELECT t.*, 
      COALESCE(ic.name, ec.name) as category_name
    FROM transactions t
    LEFT JOIN income_categories ic 
      ON t.type = 'income' AND t.category_id = ic.id
    LEFT JOIN expense_categories ec 
      ON t.type = 'expense' AND t.category_id = ec.id
  `;
  const whereClauses = [];
  const params = [];
  const validFilters = ['type', 'category_id', 'start_date', 'end_date', 'min_amount', 'max_amount'];

  validFilters.forEach(filter => {
    if(queryParams[filter]) {
      switch(filter) {
        case 'start_date':
          whereClauses.push('t.date >= ?');
          params.push(queryParams[filter]);
          break;
        case 'end_date':
          whereClauses.push('t.date <= ?');
          params.push(queryParams[filter]);
          break;
        case 'min_amount':
          whereClauses.push('t.amount >= ?');
          params.push(parseFloat(queryParams[filter]));
          break;
        case 'max_amount':
          whereClauses.push('t.amount <= ?');
          params.push(parseFloat(queryParams[filter]));
          break;
        default:
          whereClauses.push(`t.${filter} = ?`);
          params.push(queryParams[filter]);
      }
    }
  });

  if(whereClauses.length > 0) {
    baseQuery += ' WHERE ' + whereClauses.join(' AND ');
  }

  return { baseQuery, params };
};

module.exports = function(app, db) {
  // Obtener transacciones con filtros, ordenación y paginación
  app.get('/transactions', [
    query('page').optional().isInt({ min: 1 }).toInt().default(1),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().default(10),
    query('sort').optional().isIn(['date', 'amount']).default('date'),
    query('order').optional().isIn(['asc', 'desc']).default('desc')
  ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const page = req.query.page || 1;
    const limit = req.query.limit || 50;
    const offset = (page - 1) * limit;

    const { baseQuery, params } = buildTransactionsQuery(req.query);
    let queryString = baseQuery;

    // Ordenación
    if(req.query.sort && req.query.order) {
      queryString += ` ORDER BY t.${req.query.sort} ${req.query.order.toUpperCase()}`;
    } else {
      queryString += ' ORDER BY t.date DESC';
    }

    // Paginación
    queryString += ' LIMIT ? OFFSET ?';
    const paginationParams = [...params, limit, offset];

    try {
      const transactions = await new Promise((resolve, reject) => {
        db.all(queryString, paginationParams, (err, rows) => {
          if(err) reject(err);
          else resolve(rows);
        });
      });

      const total = await new Promise((resolve, reject) => {
        const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery})`;
        db.get(countQuery, params, (err, row) => {
          if (err) reject(err);
          else resolve(row?.total || 0);
        });
      });

      res.json({
        data: transactions,
        pagination: {
          page,
          limit,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limit)
        }
      });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Crear una nueva transacción
  app.post('/transactions', transactionValidations, (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { type, amount, currency, category_id, date, description } = req.body;
    // Validación de existencia de la categoría según el tipo
    const table = type === 'income' ? 'income_categories' : 'expense_categories';
    db.get(`SELECT id FROM ${table} WHERE id = ?`, [category_id], (err, row) => {
      if(err || !row) {
        return res.status(400).json({ error: 'Categoría inválida para el tipo especificado' });
      }

      db.run(
        `INSERT INTO transactions (type, amount, currency, category_id, date, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [type, amount, currency.toUpperCase(), category_id, date, description],
        function(err) {
          if(err) return res.status(500).json({ error: err.message });
          res.json({ id: this.lastID });
        }
      );
    });
  });
};
