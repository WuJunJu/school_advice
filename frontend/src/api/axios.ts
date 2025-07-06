import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Assuming the backend runs on port 8080
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient; 