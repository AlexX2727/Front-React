import { useState, useEffect } from "react";
import api from "../api/axios";
import "./CrearProyectoModal.css";

interface ProjectData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface CrearProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: ProjectData) => void;
}

const CrearProyectoModal: React.FC<CrearProyectoModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeField, setActiveField] = useState("");

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      });
      setError("");
      setSuccess(false);
      setActiveField("");
      setLoading(false);
    }
  }, [isOpen]);

  // Efecto para mostrar animación cuando se crea exitosamente
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        // Solo cerrar el modal, no llamar a onProjectCreated aquí
        onClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName);
  };

  const handleBlur = () => {
    setActiveField("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/projects",
        {
          ...form,
          owner_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data) {
        setSuccess(true);
        setError('');
        
        // Llamar al callback onSuccess con los datos del proyecto creado
        if (onSuccess) {
          onSuccess({
            id: response.data.id,
            name: form.name,
            description: form.description,
            startDate: form.startDate,
            endDate: form.endDate
          });
        }
        
        // Cerrar el modal después de 1.5 segundos
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('Error al crear el proyecto');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Error al crear el proyecto";
      setError(msg);
      
      // Efecto de shake en error
      const formElement = document.querySelector('.crear-proyecto-form-wrapper');
      formElement?.classList.add('shake-animation');
      setTimeout(() => {
        formElement?.classList.remove('shake-animation');
      }, 500);
      
    } finally {
      setLoading(false);
    }
  };

  // Si no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="crear-proyecto-modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="crear-proyecto-modal dark-theme">
        <div className="crear-proyecto-modal-dialog">
          <div className="crear-proyecto-modal-content">
            {/* Elementos decorativos animados */}
            <div className="animated-bg">
              <div className="animated-shape shape1"></div>
              <div className="animated-shape shape2"></div>
              <div className="animated-shape shape3"></div>
              <div className="animated-shape shape4"></div>
            </div>

            {/* Header con botón cerrar */}
            <div className="crear-proyecto-modal-header">
              <div className="form-title-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1>Crear Nuevo Proyecto</h1>
              <button className="crear-proyecto-modal-close" onClick={onClose}>
                ×
              </button>
            </div>

            {/* Body */}
            <div className="crear-proyecto-modal-body">
              <div className="crear-proyecto-form-wrapper">
                {success ? (
                  <div className="success-container">
                    <div className="success-effect">
                      <div className="success-icon">✓</div>
                      <div className="success-rings">
                        <div className="ring ring1"></div>
                        <div className="ring ring2"></div>
                        <div className="ring ring3"></div>
                      </div>
                    </div>
                    <h3>¡Proyecto creado exitosamente!</h3>
                    <p>Cerrando modal...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="animated-form">
                    <div className={`input-group ${activeField === 'name' ? 'active' : ''}`}>
                      <label htmlFor="name">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Nombre del proyecto
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        onFocus={() => handleFocus('name')}
                        onBlur={handleBlur}
                        placeholder="Ingrese el nombre del proyecto"
                        required
                      />
                      <div className="input-highlight"></div>
                    </div>
                    
                    <div className={`input-group ${activeField === 'description' ? 'active' : ''}`}>
                      <label htmlFor="description">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Descripción (opcional)
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        onFocus={() => handleFocus('description')}
                        onBlur={handleBlur}
                        placeholder="Describa su proyecto"
                        rows={4}
                      />
                      <div className="input-highlight"></div>
                    </div>
                    
                    <div className="dates-container">
                      <div className={`input-group date ${activeField === 'startDate' ? 'active' : ''}`}>
                        <label htmlFor="startDate">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Fecha de inicio
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={form.startDate}
                          onChange={handleChange}
                          onFocus={() => handleFocus('startDate')}
                          onBlur={handleBlur}
                        />
                        <div className="input-highlight"></div>
                      </div>
                      
                      <div className={`input-group date ${activeField === 'endDate' ? 'active' : ''}`}>
                        <label htmlFor="endDate">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Fecha de finalización
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={form.endDate}
                          onChange={handleChange}
                          onFocus={() => handleFocus('endDate')}
                          onBlur={handleBlur}
                        />
                        <div className="input-highlight"></div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className={`submit-button ${loading ? 'loading' : ''}`}
                    >
                      <span className="button-content">
                        <span className="button-text">{loading ? "Creando proyecto..." : "Crear proyecto"}</span>
                        <span className="button-icon">{loading ? "⟳" : "✓"}</span>
                      </span>
                      <span className="button-background"></span>
                    </button>
                    
                    {error && (
                      <div className="error-container">
                        <div className="error-icon">!</div>
                        <p>{error}</p>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CrearProyectoModal;