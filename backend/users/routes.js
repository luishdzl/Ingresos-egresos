const { body, validationResult } = require('express-validator');

module.exports = function(app, db) {
  // Obtener todos los usuarios
  app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        console.error('Error en GET /users:', err.message); // Log detallado
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.json(rows || []);
    });
  });

  // Crear un nuevo usuario
  app.post('/users', [
    body('name').isString().trim().notEmpty(),
    body('default_currency').optional().isLength({ min: 3, max: 3 })
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { name, default_currency } = req.body;
    db.run(
      'INSERT INTO users (name, default_currency) VALUES (?, ?)',
      [name.trim(), default_currency ? default_currency.toUpperCase() : 'USD'],
      function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  });

  // Actualizar un usuario
  app.put('/users/:id', [
    body('name').optional().isString().trim(),
    body('default_currency').optional().isLength({ min: 3, max: 3 })
  ], (req, res) => {
    const { id } = req.params;
    const { name, default_currency } = req.body;
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if(err) return res.status(500).json({ error: err.message });
      if(!row) return res.status(404).json({ error: 'Usuario no encontrado' });
      
      db.run(
        'UPDATE users SET name = COALESCE(?, name), default_currency = COALESCE(?, default_currency) WHERE id = ?',
        [name, default_currency ? default_currency.toUpperCase() : null, id],
        function(err) {
          if(err) return res.status(500).json({ error: err.message });
          res.json({ id: Number(id), name: name || row.name, default_currency: default_currency || row.default_currency });
        }
      );
    });
  });

  // Eliminar un usuario
  app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if(err) return res.status(500).json({ error: err.message });
      if(this.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario eliminado exitosamente', deletedId: id });
    });
  });
};
