import axios from 'axios';
import { RequestModel, KeyValuePair } from './store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  // Collections
  getCollections: async () => {
    const res = await apiClient.get('/collections/');
    return res.data;
  },
  createCollection: async (name: string, description?: string) => {
    const res = await apiClient.post('/collections/', { name, description });
    return res.data;
  },
  updateCollection: async (id: number, name: string, description?: string) => {
    const res = await apiClient.put(`/collections/${id}`, { name, description });
    return res.data;
  },
  deleteCollection: async (id: number) => {
    const res = await apiClient.delete(`/collections/${id}`);
    return res.data;
  },

  // Requests
  saveRequest: async (collectionId: number, request: RequestModel) => {
    const data = {
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      query_params: request.queryParams,
      body_type: request.bodyType,
      body_content: request.bodyContent,
      auth_type: request.auth.type,
      auth_config: request.auth,
    };
    const res = await apiClient.post(`/collections/${collectionId}/requests/`, data);
    return res.data;
  },
  updateRequest: async (requestId: number, request: RequestModel) => {
    const data = {
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      query_params: request.queryParams,
      body_type: request.bodyType,
      body_content: request.bodyContent,
      auth_type: request.auth.type,
      auth_config: request.auth,
    };
    const res = await apiClient.put(`/requests/${requestId}`, data);
    return res.data;
  },
  deleteRequest: async (requestId: number) => {
    const res = await apiClient.delete(`/requests/${requestId}`);
    return res.data;
  },

  // Proxy (Send real request)
  sendRequest: async (request: RequestModel) => {
    const data = {
      method: request.method,
      url: request.url,
      headers: request.headers.map(h => ({ key: h.key, value: h.value, is_active: h.isActive })),
      body_type: request.bodyType,
      body_content: request.bodyContent,
      auth_type: request.auth.type,
      auth_config: request.auth,
    };
    const res = await apiClient.post('/proxy/', data);
    return res.data;
  },

  // History
  getHistory: async () => {
    const res = await apiClient.get('/history/');
    return res.data;
  },
  clearHistory: async () => {
    const res = await apiClient.delete('/history/');
    return res.data;
  },
  deleteHistoryEntry: async (id: number) => {
    const res = await apiClient.delete(`/history/${id}`);
    return res.data;
  },

  // Environments
  getEnvironments: async () => {
    const res = await apiClient.get('/environments/');
    return res.data;
  },
  createEnvironment: async (name: string) => {
    const res = await apiClient.post('/environments/', { name });
    return res.data;
  },
  updateEnvironment: async (id: number, name: string) => {
    const res = await apiClient.put(`/environments/${id}`, { name });
    return res.data;
  },
  deleteEnvironment: async (id: number) => {
    const res = await apiClient.delete(`/environments/${id}`);
    return res.data;
  },
  createEnvironmentVariable: async (envId: number, key: string, value: string, isActive: boolean = true) => {
    const res = await apiClient.post(`/environments/${envId}/variables/`, { key, value, is_active: isActive });
    return res.data;
  },
  updateEnvironmentVariable: async (envId: number, varId: number, data: { key?: string; value?: string; is_active?: boolean }) => {
    const res = await apiClient.put(`/environments/${envId}/variables/${varId}`, data);
    return res.data;
  },
  deleteEnvironmentVariable: async (envId: number, varId: number) => {
    const res = await apiClient.delete(`/environments/${envId}/variables/${varId}`);
    return res.data;
  },
};
