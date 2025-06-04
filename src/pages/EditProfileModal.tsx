import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import ReactDOM from 'react-dom';
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModalContent: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;
    
    if (!user) {
      onClose();
      return;
    }

    if (!dataLoaded) {
      loadUserData();
    }
  }, [isOpen, user, dataLoaded]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Manejar tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen]);

  // Reset estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess("");
      setDataLoaded(false);
    }
  }, [isOpen]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      const userData = response.data;
      
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        username: userData.username || "",
        phone: userData.phone || "",
      });
      
      if (userData.avatar) {
        setPreviewUrl(userData.avatar);
      }
      
      setDataLoaded(true);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setError("No se pudo cargar el perfil. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambio de avatar
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar tipo de archivo
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setError("Por favor, selecciona una imagen válida (jpg, png, gif)");
        return;
      }

      // Verificar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen debe pesar menos de 5MB");
        return;
      }
      
      // Mostrar vista previa local
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPreviewUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  
  const handleCancel = () => {
    onClose();
    navigate('/principal'); 
  };

  // Manejar envío del formulario
  const handleSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    
    if (!user) {
      handleCancel();
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Obtener el input file directamente del DOM
      const fileInput = document.getElementById('avatar-modal') as HTMLInputElement;
      const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
      
      // Crear un nuevo FormData
      const formDataObject = new FormData();
      
      // Añadir todos los campos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataObject.append(key, value);
        }
      });
      
      // Añadir el archivo si existe
      if (hasFile) {
        const file = fileInput.files![0];
        formDataObject.append('avatar', file);
      }
      
      // Usar fetch directamente para mayor control
      const fetchResponse = await fetch(`${api.defaults.baseURL}/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataObject
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Error ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }
      
      const responseData = await fetchResponse.json();
      
      // Actualizar localStorage
      const updatedUser = { ...user, ...responseData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Verificar si el avatar se actualizó
      if (hasFile && responseData.avatar) {
        const refreshedUrl = `${responseData.avatar}?t=${new Date().getTime()}`;
        setPreviewUrl(refreshedUrl);
        
        // Precargar imagen
        const img = new Image();
        img.src = refreshedUrl;
      }
      
      setSuccess("Perfil actualizado correctamente ✅");
      
     
      setTimeout(() => {
        onSuccess();
        onClose();
        navigate('/principal'); 
      }, 1500);
      
    } catch (error) {
      console.error("Error al actualizar:", error);
      setError("No se pudo actualizar el perfil. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="edit-profile-modal-overlay" 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'fadeIn 0.3s ease-out',
        margin: 0,
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="edit-profile-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '20px',
          padding: '2rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)',
          animation: 'slideInUp 0.4s ease-out',
          color: '#f8fafc',
          margin: 'auto',
          transform: 'none' // Asegurar que no se mueva
        }}
      >
        {/* Botón cerrar */}
        <button 
          onClick={handleCancel}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: '#60a5fa',
            cursor: 'pointer',
            zIndex: 1000000,
            transition: 'all 0.3s ease',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>

        {/* Título */}
        <h2 style={{
          margin: '0 0 2rem',
          fontSize: '2rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #f8fafc 0%, #60a5fa 50%, #f8fafc 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          paddingBottom: '1rem',
          borderBottom: '2px solid rgba(59, 130, 246, 0.2)'
        }}>
          Editar Perfil
        </h2>

        {/* Estado de carga */}
        {loading && !dataLoaded && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 0',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(59, 130, 246, 0.2)',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#94a3b8' }}>Cargando perfil...</p>
          </div>
        )}

        {/* Formulario */}
        {dataLoaded && (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Campos del formulario */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <input
                name="firstName"
                placeholder="Nombre"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f8fafc',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <input
                name="lastName"
                placeholder="Apellido"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f8fafc',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <input
              name="email"
              type="email"
              placeholder="Correo"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#f8fafc',
                fontSize: '16px',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <input
                name="username"
                placeholder="Usuario"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f8fafc',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <input
                name="phone"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f8fafc',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Sección de avatar */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <label style={{
                display: 'block',
                marginBottom: '1rem',
                color: '#f8fafc',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Imagen de perfil
              </label>

              <input
                id="avatar-modal"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => {
                  const avatarInput = document.getElementById("avatar-modal");
                  if (avatarInput) avatarInput.click();
                }}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                📷 Seleccionar imagen
              </button>

              {previewUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={previewUrl}
                    alt="Avatar"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #3b82f6',
                      boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Mensajes de éxito y error */}
            {success && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                borderRadius: '12px',
                padding: '1rem',
                color: '#22c55e',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {success}
              </div>
            )}
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '12px',
                padding: '1rem',
                color: '#ef4444',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            {/* Botones */}
            {!success && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: loading ? 'rgba(100, 116, 139, 0.5)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>

                <button 
                  type="button" 
                  onClick={handleCancel} 
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'rgba(100, 116, 139, 0.2)',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.3)';
                      e.currentTarget.style.color = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Estilos CSS en línea para las animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .edit-profile-modal-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .edit-profile-modal-content::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 4px;
        }
        
        .edit-profile-modal-content::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        
        .edit-profile-modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
        
        body.modal-open {
          overflow: hidden;
        }

        /* Asegurar que el modal esté centrado en viewport completo */
        .edit-profile-modal-overlay {
          margin: 0 !important;
          left: 0 !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};

// Modal principal que usa Portal
const EditProfileModal: React.FC<EditProfileModalProps> = (props) => {
  if (!props.isOpen) {
    return null;
  }

  // Crear el portal en el body
  return ReactDOM.createPortal(
    <EditProfileModalContent {...props} />,
    document.body
  );
};

export default EditProfileModal;