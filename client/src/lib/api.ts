import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to include the Firebase ID token in requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    config.headers.Authorization = `Bearer ${user.uid}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Donation API endpoints
export const donationApi = {
  getAllDonations: async () => {
    const response = await api.get('/donations');
    return response.data;
  },

  getDonation: async (id: string) => {
    const response = await api.get(`/donations/${id}`);
    return response.data;
  },

  createDonation: async (data: any) => {
    const response = await api.post('/donations', data);
    return response.data;
  },

  updateDonation: async (id: string, data: any) => {
    const response = await api.put(`/donations/${id}`, data);
    return response.data;
  },

  deleteDonation: async (id: string) => {
    const response = await api.delete(`/donations/${id}`);
    return response.data;
  },
};

// Certificate API endpoints
export const certificateApi = {
  generateCertificate: async (donationId: number) => {
    const response = await api.post('/certificates/', { donationId });
    return response.data;
  },

  getCertificate: async (id: string) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  getCertificateByToken: async (tokenId: string) => {
    const response = await api.get(`/certificates/token/${tokenId}`);
    return response.data;
  },

  getCertificateMetadata: async (tokenId: string) => {
    const response = await api.get(`/certificates/${tokenId}/metadata`);
    return response.data;
  },

  getUserCertificates: async (userId: string) => {
    const response = await api.get(`/certificates/user/${userId}`);
    return response.data;
  },

  verifyCertificate: async (tokenId: string) => {
    const response = await api.get(`/certificates/verify/${tokenId}`);
    return response.data;
  },
};

export { api }; 