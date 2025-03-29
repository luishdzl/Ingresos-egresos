// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001', // Url de la api
  timeout: 10000,
});

export default {
  transactions: {
    get: (params) => API.get('/transactions', { params }).then(res => res.data),
    create: (data) => API.post('/transactions', data),
    delete: (id) => API.delete(`/transactions/${id}`),
    update: (id, data) => API.put(`/transactions/${id}`, data),
    getById: (id) => API.get(`/transactions/${id}`).then(res => res.data),
  },
  categories: {
    income: {
      get: () => API.get('/income-categories').then(res => res.data),
      create: (data) => API.post('/income-categories', data).then(res => res.data),
      update: (id, data) => API.put(`/income-categories/${id}`, data).then(res => res.data),
      delete: (id) => API.delete(`/income-categories/${id}`).then(res => res.data)
    },
    expense: {
      groups: {
        get: () => API.get('/expense-groups').then(res => res.data),
        create: (data) => API.post('/expense-groups', data).then(res => res.data),
        update: (id, data) => API.put(`/expense-groups/${id}`, data).then(res => res.data),
        delete: (id) => API.delete(`/expense-groups/${id}`).then(res => res.data)
      },
      categories: {
        get: () => API.get('/expense-categories').then(res => res.data),
        create: (data) => API.post('/expense-categories', data).then(res => res.data),
        update: (id, data) => API.put(`/expense-categories/${id}`, data).then(res => res.data),
        delete: (id) => API.delete(`/expense-categories/${id}`).then(res => res.data)
      },
    },
  },
  stats: {
    summary: (params) => API.get('/stats/summary', { params }).then(res => res.data),
    categories: (params) => API.get('/stats/categories', { params }).then(res => res.data),
  },
  users: {
    get: () => API.get('/users').then(res => res.data),
    create: (data) => API.post('/users', data).then(res => res.data),
    update: (id, data) => API.put(`/users/${id}`, data).then(res => res.data),
    delete: (id) => API.delete(`/users/${id}`),
  },
};