import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // httpOnly cookie support
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or unauthorized — redirect to login
      // Don't redirect if already on login-related path
      const isLoginPath =
        window.location.pathname === "/login" ||
        error.config?.url?.includes("/login");
      if (!isLoginPath && error.response?.status === 403) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
