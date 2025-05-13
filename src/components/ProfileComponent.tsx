
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./ProfileComponent.css";

interface ProfileComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; // Puedes definir una interfaz más específica para tu usuario
}

function ProfileComponent({ user }: ProfileComponentProps) {
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
    const loadUserData = async () => {
      try {
        setLoading(true);
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
  }, [user]);

  const handleEditProfile = () => {
    window.location.href = "/editar-perfil";
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1 className="profile-title">Mi Perfil</h1>
          <div className="profile-actions">
            <button className="edit-button" onClick={handleEditProfile}>
              <span className="button-icon">✏️</span>
              <span className="button-text">Editar</span>
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
  );
}

export default ProfileComponent;