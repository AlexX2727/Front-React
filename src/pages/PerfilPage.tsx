// PerfilPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./PerfilPage.css";

function PerfilPage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [userData, setUserData] = useState({
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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadUserData = async () => {
      try {
        const response = await api.get(`/users/${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        setUserData(response.data);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError("No se pudo cargar la información del perfil");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    
    // Opcional: Añadir efecto de partículas al fondo
    const createParticles = () => {
      const particles = document.createElement('div');
      particles.className = 'particles';
      document.body.appendChild(particles);
      
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = `${Math.random() * 3 + 1}px`;
        particle.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        particle.style.borderRadius = '50%';
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
        particles.appendChild(particle);
      }
    };
    
    createParticles();
    
    return () => {
      // Limpiar partículas al desmontar
      const particlesEl = document.querySelector('.particles');
      if (particlesEl) {
        particlesEl.remove();
      }
    };
  }, [user, navigate]);

  const handleEditProfile = () => {
    navigate("/editar-perfil");
  };

  const handleBack = () => {
    navigate(-1);
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

  return (
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
                  src={userData.avatar} 
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
                    <span className="info-value role-badge">{userData.role?.name || "Usuario"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && <div className="profile-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default PerfilPage;