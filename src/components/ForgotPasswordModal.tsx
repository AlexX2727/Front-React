import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import "./ForgotPasswordModal.css";

interface ForgotPasswordModalProps {
  showModal: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ showModal, onClose }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailForReset, setEmailForReset] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (showModal) {
      setMounted(true);
    } else {
      setMounted(false);
      // Reset state when modal closes
      setTimeout(() => {
        setEmail("");
        setError("");
        setSuccess("");
        setShowResetForm(false);
        setVerificationCode("");
        setPassword("");
        setConfirmPassword("");
        setEmailForReset("");
      }, 300);
    }
  }, [showModal]);

  // Handle ESC key
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        onClose();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, [showModal, onClose]);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  const shakeForm = () => {
    if (formRef.current) {
      formRef.current.classList.add('shake');
      setTimeout(() => {
        formRef.current?.classList.remove('shake');
      }, 500);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Enviar solicitud de recuperación de contraseña
      const res = await api.post("/users/forgot-password", { email });

      // Mostrar mensaje de éxito
      setSuccess(res.data.message || "Se ha enviado un código de verificación a tu correo electrónico");

      // Guardar el email para el formulario de reset y mostrar el formulario de reset
      setEmailForReset(email);
      setShowResetForm(true);

      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setIsLoading(false);

      // Manejar diferentes tipos de errores
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Error al procesar la solicitud. Inténtalo de nuevo.");
      }

      shakeForm();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validaciones básicas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      shakeForm();
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      shakeForm();
      setIsLoading(false);
      return;
    }

    try {
      // Enviar solicitud de restablecimiento de contraseña
      const res = await api.post("/users/reset-password", {
        code: verificationCode,
        email: emailForReset,
        password,
        confirmPassword
      });

      // Mostrar mensaje de éxito
      setSuccess(res.data.message || "Contraseña actualizada exitosamente");

      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        setIsLoading(false);
        // Cerrar el modal después de un tiempo
        setTimeout(() => {
          onClose();
        }, 2000);
      }, 800);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setIsLoading(false);

      // Manejar diferentes tipos de errores
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError("Código de verificación inválido o expirado");
      } else {
        setError("Error al restablecer la contraseña. Inténtalo de nuevo.");
      }

      shakeForm();
    }
  };

  if (!showModal) return null;

  return (
    <div 
      className="modal-backdrop"
      onClick={handleClickOutside}
    >
      <div className={`modal-content ${mounted ? 'fadeIn' : ''}`}>
        <button 
          className="close-button"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          ×
        </button>
        
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" strokeWidth="2" />
              <path className="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path className="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        
        <h2 className="modal-title">
          {showResetForm ? "Restablecer Contraseña" : "Recuperar Contraseña"}
        </h2>
        
        {!showResetForm ? (
          // Formulario de solicitud de recuperación
          <form className="forgot-password-form" onSubmit={handleForgotPassword} ref={formRef}>
            <div className="input-group">
              <label htmlFor="forgot-email">Correo Electrónico</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <p className="info-text">
              Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.
            </p>
            
            <button 
              type="submit" 
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                "Enviar Código"
              )}
            </button>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}
          </form>
        ) : (
          // Formulario de restablecimiento de contraseña
          <form className="reset-password-form" onSubmit={handleResetPassword} ref={formRef}>
            <input type="hidden" value={emailForReset} />
            
            <div className="input-group">
              <label htmlFor="verification-code">Código de Verificación</label>
              <input
                id="verification-code"
                type="text"
                placeholder="Ingresa el código recibido por correo"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="new-password">Nueva Contraseña</label>
              <input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="confirm-new-password">Confirmar Contraseña</label>
              <input
                id="confirm-new-password"
                type="password"
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                "Restablecer Contraseña"
              )}
            </button>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;