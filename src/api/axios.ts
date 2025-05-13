import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // conexion al Api REST
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejar errores de autenticación globalmente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.log('Token inválido o expirado, limpiando sesión...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
