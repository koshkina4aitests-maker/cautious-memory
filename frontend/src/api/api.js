import axios from "axios";

const api = axios.create({
  // Fallback указывает на внешний IP сервера, чтобы frontend работал с любых клиентских машин.
  baseURL: import.meta.env.VITE_API_URL || "http://85.209.0.78:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  me: () => api.get("/auth/me"),
};

export const analystApi = {
  listTemplates: () => api.get("/analyst/templates"),
  getTemplate: (id) => api.get(`/analyst/templates/${id}`),
  createTemplate: (payload) => api.post("/analyst/templates", payload),
  updateTemplate: (id, payload) => api.put(`/analyst/templates/${id}`, payload),
  deleteTemplate: (id) => api.delete(`/analyst/templates/${id}`),

  listRequirements: () => api.get("/analyst/requirements"),
  getRequirement: (id) => api.get(`/analyst/requirements/${id}`),
  createRequirement: (payload) => api.post("/analyst/requirements", payload),
  updateRequirement: (id, payload) => api.put(`/analyst/requirements/${id}`, payload),
  deleteRequirement: (id) => api.delete(`/analyst/requirements/${id}`),

  listRules: () => api.get("/analyst/rules"),
  getRule: (id) => api.get(`/analyst/rules/${id}`),
  createRule: (payload) => api.post("/analyst/rules", payload),
  updateRule: (id, payload) => api.put(`/analyst/rules/${id}`, payload),
  deleteRule: (id) => api.delete(`/analyst/rules/${id}`),
};

export const adminApi = {
  listUsers: () => api.get("/admin/users"),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (payload) => api.post("/admin/users", payload),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  listTemplates: () => api.get("/admin/templates"),
  getTemplate: (id) => api.get(`/admin/templates/${id}`),
  createTemplate: (payload) => api.post("/admin/templates", payload),
  updateTemplate: (id, payload) => api.put(`/admin/templates/${id}`, payload),
  deleteTemplate: (id) => api.delete(`/admin/templates/${id}`),

  listRequirements: () => api.get("/admin/requirements"),
  getRequirement: (id) => api.get(`/admin/requirements/${id}`),
  createRequirement: (payload) => api.post("/admin/requirements", payload),
  updateRequirement: (id, payload) => api.put(`/admin/requirements/${id}`, payload),
  deleteRequirement: (id) => api.delete(`/admin/requirements/${id}`),

  listRules: () => api.get("/admin/rules"),
  getRule: (id) => api.get(`/admin/rules/${id}`),
  createRule: (payload) => api.post("/admin/rules", payload),
  updateRule: (id, payload) => api.put(`/admin/rules/${id}`, payload),
  deleteRule: (id) => api.delete(`/admin/rules/${id}`),
};

export default api;
