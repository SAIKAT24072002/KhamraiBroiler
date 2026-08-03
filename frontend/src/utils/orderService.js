// src/utils/orderService.js – Handles guest order submission via backend API
import api from './api';

/**
 * Submit a guest order to the backend.
 * Returns the full order object (including orderNumber).
 */
export const submitGuestOrder = async (orderData) => {
  const res = await api.post('/orders/guest', orderData);
  return res.data;
};
