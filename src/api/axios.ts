import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // Puerto donde corre el backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Configurar el token en las solicitudes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación globalmente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.log('Error de autenticación detectado');
      
      // Verificar si el token existe antes de limpiar la sesión
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Token inválido o expirado, limpiando sesión...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      // No redirigir inmediatamente, permitir que la aplicación maneje el error
      return Promise.reject({
        ...error,
        message: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
      });
    }
    return Promise.reject(error);
  }
);

export default api;
