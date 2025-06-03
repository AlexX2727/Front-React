// axios.ts

import axios from "axios";

// Configuración adicional para depuración
const axiosInstance = axios.create({
  baseURL: "https://backend-vrsl.onrender.com", // Puerto donde corre el backend
  headers: {
    "Content-Type": "application/json",
  }
});

// Interceptor para agregar el token a las solicitudes
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para depuración
    console.log(`${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
axiosInstance.interceptors.response.use(
  response => {
    // Log para respuestas exitosas
    console.log(`Respuesta ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  error => {
    // Manejar errores, especialmente 401
    if (error.response?.status === 401) {
      console.log('Error de autenticación detectado');
      
      // Verificar si el token existe antes de limpiar la sesión
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Token inválido o expirado, limpiando sesión...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    // Log para errores
    console.error(`Error en ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

export default axiosInstance;