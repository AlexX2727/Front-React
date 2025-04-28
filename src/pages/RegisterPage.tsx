import { useState  } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./RegisterStyles.css"; 

function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/users", form);
      
      // Mostrar animación de éxito
      const formElement = document.querySelector(".register-form");
      const successElement = document.querySelector(".success-message");
      
      if (formElement && successElement) {
        formElement.classList.add("form-success");
        successElement.classList.add("show-success");
        
        setTimeout(() => {
          navigate("/");
        }, 2500);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setIsLoading(false);
      const msg =
        err.response?.data?.message ||
        "Error al registrar usuario. Intenta nuevamente.";
      setError(msg);

      // Animación de error
      const formElement = document.querySelector(".register-form");
      if (formElement) {
        formElement.classList.add("form-error");
        setTimeout(() => {
          formElement.classList.remove("form-error");
        }, 500);
      }
    }
  };

  return (
    <div className="register-page">
      <div className="animated-background">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
      </div>
      
      <div className="register-container">
        <div className="logo-section">
          <div className="logo">
            <span className="logo-icon">✓</span>
          </div>
          <h1>Gestor de Tareas</h1>
        </div>
        
        <div className="register-form-container">
          <h2>Crear nueva cuenta</h2>
          
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>¡Registro Exitoso!</h3>
            <p>Redirigiendo al inicio de sesión...</p>
          </div>
          
          {error && <div className="error-banner">{error}</div>}
          
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="firstName">Nombre</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="lastName">Apellido</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="username">Nombre de usuario</label>
              <div className="input-with-prefix">
                <span className="input-prefix">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="username"
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <div className="password-strength">
                <div className="strength-meter">
                  <div 
                    className={`strength-value strength-${passwordStrength}`} 
                    style={{ width: `${passwordStrength * 25}%` }}
                  ></div>
                </div>
                <span className="password-hint">
                  La contraseña debe tener al menos 8 caracteres
                </span>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Procesando...</span>
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>
          
          <div className="login-link">
            <p>¿Ya tienes cuenta?</p>
            <button onClick={() => navigate("/")}>Iniciar sesión aquí</button>
          </div>
        </div>
        
        <div className="copyright">
          © 2025 Gestor de Tareas. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;