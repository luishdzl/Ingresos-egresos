const { body, validationResult } = require('express-validator');

module.exports = function(app, db) {
  // Obtener todas las categorías de gastos
  app.get('/expense-categories', (req, res) => {
    db.all('SELECT * FROM expense_categories', (err, rows) => {
      if(err) {
        console.error('Error en consulta de categorías:', err);
        return res.status(500).json({ error: 'Error en base de datos', details: err.message });
      }
      res.json(rows || []);
    });
  });

  // Crear una nueva categoría de gasto
  app.post('/expense-categories', [
    body('group_id').optional().isInt({ gt: 0 }).toInt(),
    body('name').isString().trim().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { group_id, name } = req.body;
    const finalGroupId = group_id || null;

    db.get(
      `SELECT id FROM expense_categories 
       WHERE name = ? AND (group_id = ? OR (group_id IS NULL AND ? IS NULL))`,
      [name.trim(), finalGroupId, finalGroupId],
      (err, row) => {
        if(err) return res.status(500).json({ error: err.message });
        if(row) return res.status(409).json({ error: 'La categoría ya existe en este grupo' });

        db.run(
          'INSERT INTO expense_categories (group_id, name) VALUES (?, ?)',
          [finalGroupId, name.trim()],
          function(err) {
            if(err) {
              if(err.message.includes('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'Error de restricción única' });
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

  // Actualizar una categoría de gasto
  app.put('/expense-categories/:id', [
    body('name').isString().trim().notEmpty(),
    body('group_id').optional().isInt({ gt: 0 }).toInt()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name, group_id } = req.body;
    const finalGroupId = group_id || null;

    if(isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    db.get('SELECT id FROM expense_categories WHERE id = ?', [id], (err, row) => {
      if(err) return res.status(500).json({ error: err.message });
      if(!row) return res.status(404).json({ error: 'Categoría no encontrada' });

      db.get(
        `SELECT id FROM expense_categories 
         WHERE name = ? AND (group_id = ? OR (group_id IS NULL AND ? IS NULL)) AND id != ?`,
        [name.trim(), finalGroupId, finalGroupId, id],
        (err, existing) => {
          if(err) return res.status(500).json({ error: err.message });
          if(existing) return res.status(409).json({ error: 'La categoría ya existe en este grupo' });

          db.run(
            'UPDATE expense_categories SET name = ?, group_id = ? WHERE id = ?',
            [name.trim(), finalGroupId, id],
            function(err) {
              if(err) return res.status(500).json({ error: err.message });
              res.json({ id: Number(id), name: name.trim(), group_id: finalGroupId });
            }
          );
        }
      );
    });
  });
};
