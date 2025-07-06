import apiClient from './axios';

// We need to set the auth token for all admin requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminSuggestions = async (params: any) => {
  const response = await apiClient.get('/admin/suggestions', { params });
  return response.data;
};

export const getSuggestionDetails = async (id: number) => {
  const response = await apiClient.get(`/admin/suggestions/${id}`);
  return response.data;
}

export const updateSuggestionStatus = async (id: number, status: string) => {
  const response = await apiClient.put(`/admin/suggestions/${id}/status`, { status });
  return response.data;
};

export const addSuggestionReply = async (id: number, content: string) => {
  const response = await apiClient.post(`/admin/suggestions/${id}/replies`, { content });
  return response.data;
};

// --- User Management ---
export const getAdmins = async () => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

export const createAdmin = async (data: any) => {
  const response = await apiClient.post('/admin/users', data);
  return response.data;
};

export const updateAdmin = async (id: number, data: any) => {
  const response = await apiClient.put(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteAdmin = async (id: number) => {
  const response = await apiClient.delete(`/admin/users/${id}`);
  return response.data;
};

// --- Dashboard ---
export const getDashboardStats = async () => {
  const response = await apiClient.get('/admin/dashboard/stats');
  return response.data;
};

// --- Department Management ---
export const getDepartmentsAdmin = async () => {
  const response = await apiClient.get('/admin/departments');
  return response.data;
};

export const createDepartment = async (data: { name: string }) => {
  const response = await apiClient.post('/admin/departments', data);
  return response.data;
};

export const updateDepartment = async (id: number, data: { name: string }) => {
  const response = await apiClient.put(`/admin/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: number) => {
  const response = await apiClient.delete(`/admin/departments/${id}`);
  return response.data;
};

export const deleteSuggestions = async (ids: number[]) => {
  const response = await apiClient.delete('/admin/suggestions', {
    data: { ids },
  });
  return response.data;
}; 