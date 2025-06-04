// PerfilPage.tsx
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from 'react-dom';
import api from "../api/axios";
import "./PerfilPage.css";

interface UserData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  avatar: string | null;
  role?: { name: string };
  role_id?: number;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function PerfilPage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    avatar: null,
    role: { name: "" }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados del modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    loadUserData();
    
    // Crear partículas de fondo
    const createParticles = () => {
      const particles = document.createElement('div');
      particles.className = 'particles';
      particles.style.position = 'fixed';
      particles.style.top = '0';
      particles.style.left = '0';
      particles.style.width = '100%';
      particles.style.height = '100%';
      particles.style.pointerEvents = 'none';
      particles.style.zIndex = '1';
      document.body.appendChild(particles);
      
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = `${Math.random() * 3 + 1}px`;
        particle.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        particle.style.borderRadius = '50%';
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
        particles.appendChild(particle);
      }
    };
    
    createParticles();
    
    return () => {
      const particlesEl = document.querySelector('.particles');
      if (particlesEl) {
        particlesEl.remove();
      }
    };
  }, [user, navigate]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showEditModal) {
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
  }, [showEditModal]);

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    if (!showEditModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCloseEditModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [showEditModal]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      setUserData(response.data);
      setError("");
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setError("No se pudo cargar la información del perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    // Llenar el formulario con los datos actuales
    setEditFormData({
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      username: userData.username || "",
      phone: userData.phone || "",
    });
    
    if (userData.avatar) {
      setPreviewUrl(userData.avatar);
    }
    
    setShowEditModal(true);
    setEditError("");
    setEditSuccess("");
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditError("");
    setEditSuccess("");
    setPreviewUrl(userData.avatar);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Funciones del modal de edición
  const handleEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar tipo de archivo
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setEditError("Por favor, selecciona una imagen válida (jpg, png, gif)");
        return;
      }

      // Verificar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setEditError("La imagen debe pesar menos de 5MB");
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
      setEditError("");
    }
  };

  const handleEditSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }
    
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    
    try {
      const fileInput = document.getElementById('avatar-modal') as HTMLInputElement;
      const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
      
      const formDataObject = new FormData();
      
      // Añadir campos del formulario
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value) {
          formDataObject.append(key, value);
        }
      });
      
      // Añadir archivo si existe
      if (hasFile) {
        const file = fileInput.files![0];
        formDataObject.append('avatar', file);
      }
      
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
      }
      
      setEditSuccess("Perfil actualizado correctamente ✅");
      
      // Recargar datos del perfil y cerrar modal
      setTimeout(async () => {
        await loadUserData();
        handleCloseEditModal();
      }, 1500);
      
    } catch (error) {
      console.error("Error al actualizar:", error);
      setEditError("No se pudo actualizar el perfil. Intenta de nuevo más tarde.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseEditModal();
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No disponible";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const getRoleLabel = (userData: UserData): string => {
    if (userData.role?.name) {
      return userData.role.name;
    }
    
    switch (userData.role_id) {
      case 1:
        return "Administrador";
      case 2:
        return "Usuario";
      case 3:
        return "Moderador";
      default:
        return "Usuario";
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const EditModal = () => {
    if (!showEditModal) return null;

    return ReactDOM.createPortal(
      <div 
        className="edit-profile-modal-overlay" 
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-out'
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
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)',
            animation: 'slideInUp 0.4s ease-out',
            color: '#f8fafc'
          }}
        >
          {/* Botón cerrar */}
          <button 
            onClick={handleCloseEditModal}
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

          {/* Formulario */}
          <form onSubmit={handleEditSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Campos del formulario */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <input
                name="firstName"
                placeholder="Nombre"
                value={editFormData.firstName}
                onChange={handleEditChange}
                disabled={editLoading}
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
                value={editFormData.lastName}
                onChange={handleEditChange}
                disabled={editLoading}
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
              value={editFormData.email}
              onChange={handleEditChange}
              disabled={editLoading}
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
                value={editFormData.username}
                onChange={handleEditChange}
                disabled={editLoading}
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
                value={editFormData.phone}
                onChange={handleEditChange}
                disabled={editLoading}
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
                disabled={editLoading}
              />

              <button
                type="button"
                onClick={() => {
                  const avatarInput = document.getElementById("avatar-modal");
                  if (avatarInput) avatarInput.click();
                }}
                disabled={editLoading}
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

            {/* Mensajes */}
            {editSuccess && (
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
                {editSuccess}
              </div>
            )}
            
            {editError && (
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
                {editError}
              </div>
            )}

            {/* Botones */}
            {!editSuccess && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button 
                  type="submit" 
                  disabled={editLoading}
                  style={{
                    flex: 1,
                    background: editLoading ? 'rgba(100, 116, 139, 0.5)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: editLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (!editLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editLoading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {editLoading ? "Guardando..." : "Guardar cambios"}
                </button>

                <button 
                  type="button" 
                  onClick={handleCloseEditModal} 
                  disabled={editLoading}
                  style={{
                    flex: 1,
                    background: 'rgba(100, 116, 139, 0.2)',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: editLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (!editLoading) {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.3)';
                      e.currentTarget.style.color = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editLoading) {
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
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(1deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
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
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="page-container">
        <div className="page-content">
          <div className="profile-card">
            <div className="profile-header">
              <h1 className="profile-title">Mi Perfil</h1>
              <div className="profile-actions">
                <button className="edit-button" onClick={handleEditProfile}>
                  <span className="button-icon">✏️</span>
                  <span className="button-text">Editar</span>
                </button>
                <button className="back-button" onClick={handleBack}>
                  <span className="button-icon">⬅️</span>
                  <span className="button-text">Volver</span>
                </button>
              </div>
            </div>
            
            <div className="profile-content">
              <div className="profile-avatar-container">
                {userData.avatar ? (
                  <img 
                    src={`${userData.avatar}?t=${new Date().getTime()}`}
                    alt="Avatar" 
                    className="profile-avatar" 
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {userData.firstName && userData.lastName 
                      ? `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`
                      : (userData.username ? userData.username.charAt(0).toUpperCase() : '?')}
                  </div>
                )}
              </div>
              
              <div className="profile-info">
                <div className="info-section">
                  <div className="info-group">
                    <h2 className="section-title">Información Personal</h2>
                    <div className="info-row">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">{userData.firstName || "No especificado"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Apellido:</span>
                      <span className="info-value">{userData.lastName || "No especificado"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Usuario:</span>
                      <span className="info-value">{userData.username || "No especificado"}</span>
                    </div>
                  </div>
                  
                  <div className="info-group">
                    <h2 className="section-title">Información de Contacto</h2>
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{userData.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{userData.phone || "No especificado"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Rol:</span>
                      <span className="info-value role-badge">{getRoleLabel(userData)}</span>
                    </div>
                  </div>

                  {/* Nueva sección de información del sistema */}
                  <div className="info-group">
                    <h2 className="section-title">Información del Sistema</h2>
                    <div className="info-row">
                      <span className="info-label">ID de Usuario:</span>
                      <span className="info-value">{userData.id || user?.id}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estado:</span>
                      <span className="info-value">
                        <span 
                          className="role-badge" 
                          style={{
                            background: userData.status !== false
                              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          }}
                        >
                          {userData.status !== false ? "Activo" : "Inactivo"}
                        </span>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Fecha de registro:</span>
                      <span className="info-value">{formatDate(userData.createdAt)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Última actualización:</span>
                      <span className="info-value">{formatDate(userData.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {error && <div className="profile-error">{error}</div>}
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <EditModal />
    </>
  );
}

export default PerfilPage;