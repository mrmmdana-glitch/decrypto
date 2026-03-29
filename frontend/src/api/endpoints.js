import { api } from './client';

export const walletApi = {
  analyse: (address) => api.get(`/api/wallet/${encodeURIComponent(address)}`),
  graph: (address) => api.get(`/api/graph/${encodeURIComponent(address)}`),
  predict: (address) => api.post('/predict', { address }),
};

export const transactionApi = {
  get: (txid) => api.get(`/api/transaction/${encodeURIComponent(txid)}`),
};

export const networkApi = {
  summary: () => api.get('/api/network/summary'),
};
