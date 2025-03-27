// backend/index.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const cors = require('cors');
const { body, validationResult, query } = require('express-validator');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'financial.db');

const appExpress = express();
const port = 3001;

appExpress.use(cors());
appExpress.use(express.json());

// Configuración de la base de datos
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite en:", dbPath);
    
    // Crear tablas si no existen
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        default_currency TEXT NOT NULL DEFAULT 'USD'
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS income_categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS expense_groups (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY,
        group_id INTEGER,
        name TEXT NOT NULL,
        UNIQUE (group_id, name),
        FOREIGN KEY (group_id) REFERENCES expense_groups(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        user_id INTEGER DEFAULT 1,
        FOREIGN KEY (category_id) REFERENCES income_categories(id),
        FOREIGN KEY (category_id) REFERENCES expense_categories(id)
      )`);
    });
  }
});

// Middleware de validación global
const validate = validations => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    res.status(400).json({ errors: errors.array() });
  };
};

// 1. Validación estricta mejorada
const transactionValidations = [
  body('type').isIn(['income', 'expense']).withMessage('Tipo de transacción inválido'),
  body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('La moneda debe tener 3 caracteres'),
  body('category_id').isInt({ gt: 0 }).withMessage('ID de categoría inválido'),
  body('date').isISO8601().withMessage('Formato de fecha inválido (ISO 8601 requerido)'),
  body('description').optional().isString().trim().escape()
];

// 2. Paginación y 3. Filtros avanzados
const buildTransactionsQuery = (queryParams) => {
  let baseQuery = `
    SELECT t.*, 
      CASE 
        WHEN t.type = 'income' THEN ic.name
        ELSE ec.name
      END AS category_name
    FROM transactions t
    LEFT JOIN income_categories ic ON t.type = 'income' AND t.category_id = ic.id
    LEFT JOIN expense_categories ec ON t.type = 'expense' AND t.category_id = ec.id
  `;

  const whereClauses = [];
  const params = [];
  const validFilters = ['type', 'category_id', 'start_date', 'end_date', 'min_amount', 'max_amount'];

  validFilters.forEach(filter => {
    if (queryParams[filter]) {
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

  if (whereClauses.length > 0) {
    baseQuery += ' WHERE ' + whereClauses.join(' AND ');
  }

  return { baseQuery, params };
};

// Operaciones CRUD para Transactions con paginación y filtros
appExpress.get('/transactions', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['date', 'amount']),
  query('order').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const page = req.query.page || 1;
  const limit = req.query.limit || 50;
  const offset = (page - 1) * limit;

  const { baseQuery, params } = buildTransactionsQuery(req.query);
  let queryString = baseQuery;

  // Ordenación
  if (req.query.sort && req.query.order) {
    queryString += ` ORDER BY t.${req.query.sort} ${req.query.order.toUpperCase()}`;
  } else {
    queryString += ' ORDER BY t.date DESC';
  }

  // Paginación
  queryString += ' LIMIT ? OFFSET ?';
  const paginationParams = [...params, limit, offset];

  try {
    const [transactions, total] = await Promise.all([
      new Promise((resolve, reject) => {
        db.all(queryString, paginationParams, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      new Promise((resolve, reject) => {
        const countQuery = `SELECT COUNT(*) as total ${baseQuery.split('FROM')[1]}`;
        db.get(countQuery, params, (err, row) => {
          if (err) reject(err);
          else resolve(row.total);
        });
      })
    ]);

    res.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Endpoints para estadísticas
appExpress.get('/stats/summary', [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const whereClauses = [];
    const params = [];

    if (req.query.start_date) {
      whereClauses.push('date >= ?');
      params.push(req.query.start_date);
    }
    if (req.query.end_date) {
      whereClauses.push('date <= ?');
      params.push(req.query.end_date);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const summary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
          (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) as balance
        FROM transactions
        ${where}
      `, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

appExpress.get('/stats/categories', [
  query('type').isIn(['income', 'expense']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const whereClauses = ['t.type = ?'];
    const params = [req.query.type];

    if (req.query.start_date) {
      whereClauses.push('t.date >= ?');
      params.push(req.query.start_date);
    }
    if (req.query.end_date) {
      whereClauses.push('t.date <= ?');
      params.push(req.query.end_date);
    }

    const categories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.name as category,
          SUM(t.amount) as total,
          COUNT(t.id) as transactions
        FROM transactions t
        JOIN ${req.query.type === 'income' ? 'income_categories' : 'expense_categories'} c
          ON t.category_id = c.id
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY c.id
        ORDER BY total DESC
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Operaciones CRUD actualizadas con validación
appExpress.post('/transactions', validate(transactionValidations), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { type, amount, currency, category_id, date, description } = req.body;
  
  // Validación adicional de existencia de categoría
  const table = type === 'income' ? 'income_categories' : 'expense_categories';
  db.get(`SELECT id FROM ${table} WHERE id = ?`, [category_id], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ error: 'Categoría inválida para el tipo especificado' });
    }

    db.run(
      `INSERT INTO transactions 
      (type, amount, currency, category_id, date, description)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [type, amount, currency.toUpperCase(), category_id, date, description],
      function(err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ id: this.lastID });
      }
    );
  });
});

// Cambiar el manejo de respuesta vacía en GET /income-categories
appExpress.get('/income-categories', (req, res) => {
  db.all('SELECT * FROM income_categories', (err, rows) => {
    if (err) {
      console.error('Error en consulta de categorías:', err);
      return res.status(500).json({ 
        error: 'Error en base de datos',
        details: err.message 
      });
    }
    
    // Siempre devolver 200 incluso si no hay resultados
    res.json(rows || []); // Devuelve array vacío si no hay datos
  });
});

// Manejar eliminaciones en delete /income-categories
appExpress.delete('/income-categories/:id', (req, res) => { // ✅
  const { id } = req.params; // ✅ Obtener ID de parámetros de la URL
  
  // Validación adicional recomendada
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'ID debe ser un número entero' });
  }

  // Verificar existencia antes de eliminar
  db.get('SELECT id FROM income_categories WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Categoría no encontrada' });

    // Eliminación propiamente dicha
    db.run(`DELETE FROM income_categories WHERE id = ?`, [id], function(err) {
      if (err) {
        // Manejar error de FK constraint (si hay transacciones relacionadas)
        if (err.message.includes('FOREIGN KEY')) {
          return res.status(409).json({ 
            error: 'No se puede eliminar: Existen transacciones relacionadas',
            solution: 'Elimina o actualiza las transacciones primero'
          });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ 
        message: 'Eliminado exitosamente',
        deletedId: id
      });
    });
  });
});

// Endpoints existentes actualizados con validación
appExpress.post('/income-categories', [
  body('name').isString().trim().notEmpty(),
  body('description').optional().isString().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  db.run(
    'INSERT INTO income_categories (name, description) VALUES (?, ?)',
    [name.trim(), description?.trim()],
    function(err) {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ id: this.lastID });
    }
  );
});

// backend/index.js (agregar después del POST /income-categories)
appExpress.put('/income-categories/:id', [
  body('name').isString().trim().notEmpty(),
  body('description').optional().isString().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { name, description } = req.body;

  // Validar ID numérico
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID de categoría inválido' });
  }

  // Verificar existencia de la categoría
  db.get('SELECT id FROM income_categories WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Categoría no encontrada' });

    // Verificar unicidad del nuevo nombre
    db.get(
      'SELECT id FROM income_categories WHERE name = ? AND id != ?',
      [name.trim(), id],
      (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing) {
          return res.status(409).json({ error: 'El nombre ya existe' });
        }

        // Actualizar la categoría
        db.run(
          `UPDATE income_categories 
           SET name = ?, description = ?
           WHERE id = ?`,
          [name.trim(), description?.trim(), id],
          function(err) {
            if (err) {
              // Manejar errores de base de datos
              if (err.message.includes('SQLITE_CONSTRAINT')) {
                return res.status(409).json({ error: 'El nombre ya existe' });
              }
              return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            
            res.json({
              id: Number(id),
              name: name.trim(),
              description: description?.trim()
            });
          }
        );
      }
    );
  });
});
// Cambiar el manejo de respuesta vacía en GET /expense-groups
appExpress.get('/expense-groups', (req, res) => {
  db.all('SELECT * FROM expense_groups', (err, rows) => {
    if (err) {
      console.error('Error en consulta de grupo:', err);
      return res.status(500).json({ 
        error: 'Error en base de datos',
        details: err.message 
      });
    }
    
    // Siempre devolver 200 incluso si no hay resultados
    res.json(rows || []); // Devuelve array vacío si no hay datos
  });
});
appExpress.post('/expense-groups', [
  body('name').isString().trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name } = req.body;
  db.run(
    'INSERT INTO expense_groups (name) VALUES (?)',
    [name.trim()],
    function(err) {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ id: this.lastID });
    }
  );
});

// Actualizar grupos de gastos
appExpress.put('/expense-groups/:id', [
  body('name').isString().trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { name } = req.body;

  // Validar ID
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.serialize(() => {
    // Verificar existencia
    db.get('SELECT id FROM expense_groups WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Grupo no encontrado' });

      // Verificar nombre único
      db.get(
        'SELECT id FROM expense_groups WHERE name = ? AND id != ?',
        [name.trim(), id],
        (err, existing) => {
          if (err) return res.status(500).json({ error: err.message });
          if (existing) return res.status(409).json({ error: 'El nombre ya existe' });

          // Actualizar
          db.run(
            'UPDATE expense_groups SET name = ? WHERE id = ?',
            [name.trim(), id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ id: Number(id), name: name.trim() });
            }
          );
        }
      );
    });
  });
});

// Manejar eliminaciones en delete /expense-groups
appExpress.delete('/expense-groups/:id', (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1. Actualizar categorías relacionadas
    db.run(
      'UPDATE expense_categories SET group_id = NULL WHERE group_id = ?',
      [id],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        // 2. Eliminar grupo
        db.run(
          'DELETE FROM expense_groups WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
              db.run('ROLLBACK');
              return res.status(404).json({ error: 'Grupo no encontrado' });
            }

            db.run('COMMIT');
            res.json({
              message: 'Grupo eliminado exitosamente',
              deletedId: id,
              updatedCategories: this.changes
            });
          }
        );
      }
    );
  });
});

// Cambiar el manejo de respuesta vacía en GET /income-categories
appExpress.get('/expense-categories', (req, res) => {
  db.all('SELECT * FROM expense_categories', (err, rows) => {
    if (err) {
      console.error('Error en consulta de categorías:', err);
      return res.status(500).json({ 
        error: 'Error en base de datos',
        details: err.message 
      });
    }
    
    // Siempre devolver 200 incluso si no hay resultados
    res.json(rows || []); // Devuelve array vacío si no hay datos
  });
});
// endpoint POST /expense-categories
appExpress.post('/expense-categories', [
  body('group_id').optional().isInt({ gt: 0 }).toInt(),
  body('name').isString().trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { group_id, name } = req.body;
  const finalGroupId = group_id || null;

  // Verificar unique compuesto
  db.get(
    `SELECT id FROM expense_categories 
     WHERE name = ? AND (group_id = ? OR (group_id IS NULL AND ? IS NULL))`,
    [name.trim(), finalGroupId, finalGroupId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(409).json({ error: 'La categoría ya existe en este grupo' });

      db.run(
        'INSERT INTO expense_categories (group_id, name) VALUES (?, ?)',
        [finalGroupId, name.trim()],
        function(err) {
          if (err) {
            if (err.message.includes('SQLITE_CONSTRAINT')) {
              return res.status(409).json({ error: 'Error de restricción única' });
            }
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ 
            id: this.lastID,
            group_id: finalGroupId,
            name: name.trim(),
            message: 'Categoría creada exitosamente'
          });
        }
      );
    }
  );
});

// Actualizar categorías de gastos
appExpress.put('/expense-categories/:id', [
  body('name').isString().trim().notEmpty(),
  body('group_id').optional().isInt({ gt: 0 }).toInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { name, group_id } = req.body;
  const finalGroupId = group_id || null;

  // Validar ID
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.serialize(() => {
    // Verificar existencia
    db.get('SELECT id FROM expense_categories WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Categoría no encontrada' });

      // Verificar unique compuesto
      db.get(
        `SELECT id FROM expense_categories 
         WHERE name = ? AND (group_id = ? OR (group_id IS NULL AND ? IS NULL))
         AND id != ?`,
        [name.trim(), finalGroupId, finalGroupId, id],
        (err, existing) => {
          if (err) return res.status(500).json({ error: err.message });
          if (existing) return res.status(409).json({ error: 'La categoría ya existe en este grupo' });

          // Actualizar
          db.run(
            'UPDATE expense_categories SET name = ?, group_id = ? WHERE id = ?',
            [name.trim(), finalGroupId, id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ 
                id: Number(id), 
                name: name.trim(),
                group_id: finalGroupId 
              });
            }
          );
        }
      );
    });
  });
});

// Iniciar servidor
appExpress.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});