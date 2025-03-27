const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const cors = require('cors');

const appExpress = express();
const port = 3001;

appExpress.use(cors());
appExpress.use(express.json());

// Configuración de la base de datos
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'financial.db');

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

// Cargar las rutas de cada entidad
const usersRoutes = require('./users/routes');
const incomeCategoriesRoutes = require('./income_categories/routes');
const expenseGroupsRoutes = require('./expense_groups/routes');
const expenseCategoriesRoutes = require('./expense_categories/routes');
const transactionsRoutes = require('./transactions/routes');

usersRoutes(appExpress, db);
incomeCategoriesRoutes(appExpress, db);
expenseGroupsRoutes(appExpress, db);
expenseCategoriesRoutes(appExpress, db);
transactionsRoutes(appExpress, db);

// Aquí podrías incluir endpoints globales (por ejemplo, para estadísticas) o en un módulo aparte


appExpress.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
