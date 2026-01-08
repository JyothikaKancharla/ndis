import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
// API utility functions for backend communication
export const fetchData = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, options);
  if (!response.ok) throw new Error('API error');
  return response.json();
};
