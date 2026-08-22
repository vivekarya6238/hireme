import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// attach token automatically once user logs in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hireme_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;