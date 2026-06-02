import axios from 'axios';
import { userManager } from '../auth/userManager.js';

export const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use(async (config) => {
  const user = await userManager.getUser();
  if (user?.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`;
  }
  return config;
});
