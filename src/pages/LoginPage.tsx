import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.acces_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        setIsLoading(false);
        navigate("/principal");
      }, 800);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setIsLoading(false);
      setError("Credenciales incorrectas");
      
      // Animación de error
      const form = document.querySelector('form');
      form?.classList.add('shake');
      setTimeout(() => {
        form?.classList.remove('shake');
      }, 500);
    }
  };

  const openForgotPasswordModal = () => {
    setShowForgotPasswordModal(true);
  };

  return (
    <>
      <div style={styles.pageContainer}>
        <div className="particles-container"></div>
        <div 
          className={mounted ? "fadeIn" : ""} 
          style={styles.container}
        >
          <div style={styles.logoContainer}>
            <div style={styles.logo} className="logo-icon">
              <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" strokeWidth="2" />
                <path className="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path className="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          
          <h2 style={styles.title}>Iniciar Sesión</h2>
          
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <button 
              type="submit" 
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonLoading : {})
              }}
              disabled={isLoading}
              className="glow-button"
            >
              {isLoading ? (
                <span style={styles.spinner}></span>
              ) : (
                "Ingresar"
              )}
            </button>
            
            {error && <p style={styles.error}>{error}</p>}

            <button
              type="button"
              onClick={openForgotPasswordModal}
              style={styles.forgotPasswordButton}
              className="forgot-password-button"
            >
              ¿Olvidaste tu contraseña? <span style={styles.linkAccent}>Recupérala aquí</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/register")}
            style={styles.registerButton}
            className="register-button"
          >
            ¿No tienes cuenta? <span style={styles.linkAccent}>Crea una aquí</span>
          </button>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          @keyframes particle {
            0% {
              transform: translate(0, 0);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              transform: translate(var(--tx), var(--ty));
              opacity: 0;
            }
          }
          
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.6);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
            }
          }
          
          @keyframes rotateGear {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes drawCheck {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
          
          @keyframes circleRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          body {
            margin: 0;
            padding: 0;
            background-color: #121212;
          }
          
          .fadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
          
          .shake {
            animation: shake 0.5s ease-in-out;
          }
          
          .particles-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            overflow: hidden;
          }
          
          .particles-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #121212;
            background-image: 
              radial-gradient(rgba(52, 152, 219, 0.1) 1px, transparent 1px),
              radial-gradient(rgba(52, 152, 219, 0.07) 1px, transparent 1px);
            background-size: 30px 30px;
            background-position: 0 0, 15px 15px;
          }
          
          .particles-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
          }
          
          input:focus {
            border-color: #3498db !important;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2) !important;
            transform: translateY(-2px) !important;
          }
          
          input:hover {
            border-color: #3498db !important;
          }
          
          .glow-button:hover {
            animation: pulse 1.5s infinite;
            background-color: #2980b9;
            transform: translateY(-2px);
          }
          
          .register-button:hover span,
          .forgot-password-button:hover span {
            text-decoration: underline;
          }
          
          /* Logo Animation */
          .circle-animation {
            stroke-dasharray: 126;
            animation: circleRotate 8s linear infinite;
            transform-origin: center;
          }
          
          .check-animation {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: drawCheck 2s ease forwards 0.3s;
          }
          
          .gear-animation {
            animation: rotateGear 10s linear infinite;
            transform-origin: center;
            opacity: 0.8;
          }
          
          .logo-icon {
            animation: float 6s ease-in-out infinite;
          }
        `}} />
      </div>

      {/* Modal de Recuperar Contraseña */}
      <ForgotPasswordModal 
        showModal={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </>
  );
}

const styles = {
  pageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#121212",
    padding: "20px",
    position: "relative" as const,
    overflow: "hidden",
  },
  container: {
    width: "100%",
    maxWidth: "380px",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.35)",
    opacity: 0,
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column" as const,
    position: "relative" as const,
    zIndex: 10,
    border: "1px solid rgba(52, 152, 219, 0.1)",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center" as const,
    color: "#ffffff",
    fontSize: "22px",
    marginBottom: "30px",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    color: "#b0b0b0",
    fontWeight: "500",
    marginLeft: "2px",
  },
  input: {
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid #333333",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    backgroundColor: "#252525",
    color: "#ffffff",
    outline: "none",
  },
  button: {
    padding: "14px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    marginTop: "15px",
    transition: "all 0.3s ease",
    position: "relative" as const,
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(52, 152, 219, 0.3)",
  },
  buttonLoading: {
    backgroundColor: "#2980b9",
    cursor: "not-allowed",
    opacity: 0.8,
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTopColor: "#fff",
    animation: "spin 1s ease-in-out infinite",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    textAlign: "center" as const,
    margin: "15px 0 5px",
    padding: "8px 12px",
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderRadius: "6px",
    border: "1px solid rgba(231, 76, 60, 0.2)",
    animation: "fadeIn 0.3s ease-out forwards",
  },
  forgotPasswordButton: {
    marginTop: "5px",
    backgroundColor: "transparent",
    color: "#b0b0b0",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  registerButton: {
    marginTop: "15px",
    backgroundColor: "transparent",
    color: "#b0b0b0",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  linkAccent: {
    color: "#3498db",
    fontWeight: "500",
  }
};

export default LoginPage;