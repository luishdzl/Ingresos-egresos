const { body, validationResult } = require('express-validator');

module.exports = function(app, db) {
  // Obtener todas las categorías de ingresos
  app.get('/income-categories', (req, res) => {
    db.all('SELECT * FROM income_categories', (err, rows) => {
      if(err) {
        console.error('Error en consulta de categorías:', err);
        return res.status(500).json({ error: 'Error en base de datos', details: err.message });
      }
      res.json(rows || []);
    });
  });

  // Crear una nueva categoría de ingreso
  app.post('/income-categories', [
    body('name').isString().trim().notEmpty(),
    body('description').optional().isString().trim()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    db.run(
      'INSERT INTO income_categories (name, description) VALUES (?, ?)',
      [name.trim(), description?.trim()],
      function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  });

  // Actualizar una categoría de ingreso
  app.put('/income-categories/:id', [
    body('name').isString().trim().notEmpty(),
    body('description').optional().isString().trim()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name, description } = req.body;

    if(isNaN(id)) return res.status(400).json({ error: 'ID de categoría inválido' });

    db.get('SELECT id FROM income_categories WHERE id = ?', [id], (err, row) => {
      if(err) return res.status(500).json({ error: err.message });
      if(!row) return res.status(404).json({ error: 'Categoría no encontrada' });

      db.get('SELECT id FROM income_categories WHERE name = ? AND id != ?', [name.trim(), id], (err, existing) => {
        if(err) return res.status(500).json({ error: err.message });
        if(existing) return res.status(409).json({ error: 'El nombre ya existe' });

        db.run(
          'UPDATE income_categories SET name = ?, description = ? WHERE id = ?',
          [name.trim(), description?.trim(), id],
          function(err) {
            if(err) {
              if(err.message.includes('SQLITE_CONSTRAINT')) {
                return res.status(409).json({ error: 'El nombre ya existe' });
              }
              return res.status(500).json({ error: err.message });
            }
            if(this.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
            res.json({ id: Number(id), name: name.trim(), description: description?.trim() });
          }
        );
      });
    });
  });

  // Eliminar una categoría de ingreso
  app.delete('/income-categories/:id', (req, res) => {
    const { id } = req.params;
    if(!Number.isInteger(Number(id))) return res.status(400).json({ error: 'ID debe ser un número entero' });

    db.get('SELECT id FROM income_categories WHERE id = ?', [id], (err, row) => {
      if(err) return res.status(500).json({ error: err.message });
      if(!row) return res.status(404).json({ error: 'Categoría no encontrada' });

      db.run('DELETE FROM income_categories WHERE id = ?', [id], function(err) {
        if(err) {
          if(err.message.includes('FOREIGN KEY')) {
            return res.status(409).json({ 
              error: 'No se puede eliminar: Existen transacciones relacionadas',
              solution: 'Elimina o actualiza las transacciones primero'
            });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Eliminado exitosamente', deletedId: id });
      });
    });
  });
};
