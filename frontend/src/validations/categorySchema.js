// src/validations/categorySchema.js
import * as yup from 'yup';

export const incomeCategorySchema = yup.object({
  name: yup
    .string()
    .required('El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),
  description: yup
    .string()
    .max(200, 'Máximo 200 caracteres')
});