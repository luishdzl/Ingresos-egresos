// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export default {
  transactions: {
    get: (params) => API.get('/transactions', { params }),
    create: (data) => API.post('/transactions', data),
    delete: (id) => API.delete(`/transactions/${id}`),
  },
  categories: {
    income: {
      get: () => API.get('/income-categories'),
      create: (data) => API.post('/income-categories', data),
      update: (id, data) => API.put(`/income-categories/${id}`, data),
      delete: (id) => API.delete(`/income-categories/${id}`)
    },
    expense: {
      groups: {
        get: () => API.get('/expense-groups'),
        create: (data) => API.post('/expense-groups', data),
      },
      categories: {
        get: () => API.get('/expense-categories'),
        create: (data) => API.post('/expense-categories', data),
      },
    },
  },
  stats: {
    summary: (params) => API.get('/stats/summary', { params }),
    categories: (params) => API.get('/stats/categories', { params }),
  },
};