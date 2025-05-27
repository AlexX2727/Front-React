import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./RegisterStyles.css";

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const shakeForm = () => {
    if (formRef.current) {
      formRef.current.classList.add('shake');
      setTimeout(() => {
        formRef.current?.classList.remove('shake');
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones básicas
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      shakeForm();
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      shakeForm();
      return;
    }

    setIsLoading(true);

    try {
      // Crear objeto de datos según el DTO del backend
      const userData = {
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        username: form.username || undefined,
        role_id: 2 // Rol por defecto para usuarios normales
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const res = await api.post("/users", userData);

      // Iniciar sesión automáticamente después del registro
      const loginRes = await api.post("/auth/login", { 
        email: form.email, 
        password: form.password 
      });
      
      localStorage.setItem("token", loginRes.data.acces_token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));

      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        setIsLoading(false);
        navigate("/principal");
      }, 800);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setIsLoading(false);

      // Manejar diferentes tipos de errores
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError("El email o nombre de usuario ya está registrado");
      } else {
        setError("Error al crear la cuenta. Inténtalo de nuevo.");
      }

      shakeForm();
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" strokeWidth="2" />
              <path className="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path className="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        
        <h2 className="form-title">Crear Cuenta</h2>
        
        <form className="register-form" onSubmit={handleSubmit} ref={formRef}>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="firstName">Nombre</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Tu nombre"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="lastName">Apellido</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Tu apellido"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Elige un nombre de usuario único"
              value={form.username}
              onChange={handleChange}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              "Registrarse"
            )}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </form>
        
        <div className="login-link">
          ¿Ya tienes una cuenta?{' '}
          <button 
            type="button" 
            className="link-button"
            onClick={() => navigate("/")}
          >
            haga clic aquí
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;