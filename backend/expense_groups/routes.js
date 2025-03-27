const { body, validationResult } = require('express-validator');

module.exports = function(app, db) {
  // Obtener todos los grupos de gastos
  app.get('/expense-groups', (req, res) => {
    db.all('SELECT * FROM expense_groups', (err, rows) => {
      if(err) {
        console.error('Error en consulta de grupo:', err);
        return res.status(500).json({ error: 'Error en base de datos', details: err.message });
      }
      res.json(rows || []);
    });
  });

  // Crear un nuevo grupo de gasto
  app.post('/expense-groups', [
    body('name').isString().trim().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name } = req.body;
    db.run(
      'INSERT INTO expense_groups (name) VALUES (?)',
      [name.trim()],
      function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  });

  // Actualizar un grupo de gasto
  app.put('/expense-groups/:id', [
    body('name').isString().trim().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name } = req.body;
    if(isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    db.get('SELECT id FROM expense_groups WHERE id = ?', [id], (err, row) => {
      if(err) return res.status(500).json({ error: err.message });
      if(!row) return res.status(404).json({ error: 'Grupo no encontrado' });

      db.get('SELECT id FROM expense_groups WHERE name = ? AND id != ?', [name.trim(), id], (err, existing) => {
        if(err) return res.status(500).json({ error: err.message });
        if(existing) return res.status(409).json({ error: 'El nombre ya existe' });

        db.run('UPDATE expense_groups SET name = ? WHERE id = ?', [name.trim(), id], function(err) {
          if(err) return res.status(500).json({ error: err.message });
          res.json({ id: Number(id), name: name.trim() });
        });
      });
    });
  });

  // Eliminar un grupo de gasto
  app.delete('/expense-groups/:id', (req, res) => {
    const { id } = req.params;
    if(isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Actualizar las categorías que pertenecen a este grupo
      db.run('UPDATE expense_categories SET group_id = NULL WHERE group_id = ?', [id], function(err) {
        if(err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        // Eliminar el grupo
        db.run('DELETE FROM expense_groups WHERE id = ?', [id], function(err) {
          if(err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          if(this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Grupo no encontrado' });
          }
          db.run('COMMIT');
          res.json({ message: 'Grupo eliminado exitosamente', deletedId: id, updatedCategories: this.changes });
        });
      });
    });
  });
};
