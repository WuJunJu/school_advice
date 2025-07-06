import apiClient from './axios';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post('/admin/login', credentials);
  return response.data;
}; 