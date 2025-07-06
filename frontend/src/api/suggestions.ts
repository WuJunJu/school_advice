import apiClient from './axios';

export interface SuggestionSubmission {
  title: string;
  content: string;
  category: string;
  department_id: number;
  submitter_name?: string;
  submitter_class?: string;
  is_public?: boolean;
}

export interface SubmissionResponse {
  tracking_code: string;
}

export const submitSuggestion = async (data: SuggestionSubmission): Promise<SubmissionResponse> => {
  const response = await apiClient.post('/suggestions', data);
  return response.data;
};

export const getSuggestionByCode = async (code: string) => {
  const response = await apiClient.get(`/suggestions/${code}`);
  return response.data;
};

export const getPublicSuggestions = async (params: { page: number; pageSize: number; department_id?: number }) => {
  const response = await apiClient.get('/suggestions', { params });
  return response.data;
};

export const upvoteSuggestion = async (id: number) => {
  const response = await apiClient.post(`/suggestions/${id}/upvote`);
  return response.data;
}; 