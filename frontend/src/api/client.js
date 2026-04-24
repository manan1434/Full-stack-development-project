import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export default client;

export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

export const CATEGORY_COLORS = {
  Food: '#ef4444',
  Transport: '#f59e0b',
  Shopping: '#ec4899',
  Bills: '#3b82f6',
  Entertainment: '#8b5cf6',
  Health: '#10b981',
  Education: '#14b8a6',
  Other: '#64748b',
};
