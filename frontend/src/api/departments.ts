import apiClient from './axios';

export interface Department {
  ID: number;
  Name: string;
}

export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get('/departments');
  return response.data;
}; 