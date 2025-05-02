import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./EditarPerfilPage.css";

function EditarPerfilPage() {
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

  // Cargar datos del usuario
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!dataLoaded) {
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

      loadUserData();
    }
  }, [user, navigate, dataLoaded]);

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

  // Manejar envío del formulario
  const handleSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Obtener el input file directamente del DOM
      const fileInput = document.getElementById('avatar') as HTMLInputElement;
      const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
      
      // Crear un nuevo FormData
      const formDataObject = new FormData();
      
      // Añadir todos los campos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataObject.append(key, value);
          console.log(`Agregando campo: ${key}=${value}`);
        }
      });
      
      // Añadir el archivo si existe
      if (hasFile) {
        const file = fileInput.files![0];
        formDataObject.append('avatar', file);
        console.log(`Añadiendo avatar: ${file.name} (${file.size} bytes, ${file.type})`);
      }
      
      // Verificar contenido del FormData
      console.log("Contenido del FormData:");
      for (const pair of formDataObject.entries()) {
        console.log(`${pair[0]}: ${pair[1] instanceof File ? 
          `Archivo: ${(pair[1] as File).name} (${(pair[1] as File).type}, ${(pair[1] as File).size} bytes)` : 
          pair[1]}`);
      }
      
      // Usar fetch directamente para mayor control
      const fetchResponse = await fetch(`${api.defaults.baseURL}/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
          // NO establecer Content-Type - dejar que el navegador lo haga
        },
        body: formDataObject
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Error ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }
      
      const responseData = await fetchResponse.json();
      console.log("Respuesta del servidor:", responseData);
      
      // Actualizar localStorage
      const updatedUser = { ...user, ...responseData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Verificar si el avatar se actualizó
      if (hasFile && responseData.avatar) {
        console.log("Avatar actualizado correctamente:", responseData.avatar);
        
        // Añadir timestamp para forzar recarga
        const refreshedUrl = `${responseData.avatar}?t=${new Date().getTime()}`;
        setPreviewUrl(refreshedUrl);
        
        // Precargar imagen
        const img = new Image();
        img.src = refreshedUrl;
      } else if (hasFile && !responseData.avatar) {
        console.error("Error: Se envió un avatar pero no se recibió URL en la respuesta");
        setError("La imagen no se guardó correctamente. Por favor, intenta nuevamente.");
        setLoading(false);
        return;
      }
      
      setSuccess("Perfil actualizado correctamente ✅");
    } catch (error) {
      console.error("Error al actualizar:", error);
      setError("No se pudo actualizar el perfil. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);
  
  const handleReturnToProfile = () => {
    window.location.href = "/perfil";
  };

  // Si está cargando y no hay datos, mostrar estado de carga
  if (loading && !dataLoaded) {
    return (
      <div className="profile-edit-container">
        <div className="profile-edit-content">
          <h2>Cargando perfil...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-content">
        <h2>Editar Perfil</h2>

        <form onSubmit={handleSubmit} className="profile-edit-form">
          <input
            name="firstName"
            placeholder="Nombre"
            value={formData.firstName}
            onChange={handleChange}
            disabled={loading}
          />

          <input
            name="lastName"
            placeholder="Apellido"
            value={formData.lastName}
            onChange={handleChange}
            disabled={loading}
          />

          <input
            name="email"
            type="email"
            placeholder="Correo"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />

          <input
            name="username"
            placeholder="Usuario"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />

          <input
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />

          <div className="form-group avatar-group">
            <label>Imagen de perfil</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              disabled={loading}
            />
            <button
              type="button"
              className="avatar-label"
              onClick={() => {
                const avatarInput = document.getElementById("avatar");
                if (avatarInput) avatarInput.click();
              }}
              disabled={loading}
            >
              📷 Seleccionar imagen
            </button>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Avatar"
                style={{ width: 100, height: 100, borderRadius: "50%", marginTop: 10 }}
              />
            )}
            
            {/* Mostrar nombre del archivo seleccionado */}
            {document.getElementById('avatar') && (document.getElementById('avatar') as HTMLInputElement).files && 
             (document.getElementById('avatar') as HTMLInputElement).files!.length > 0 && (
              <p style={{ fontSize: '12px', marginTop: '5px', color: 'green' }}>
                ✓ Imagen seleccionada: {(document.getElementById('avatar') as HTMLInputElement).files![0].name}
              </p>
            )}
          </div>

          {success && (
            <div>
              <p style={{ color: "green" }}>{success}</p>
              <button 
                type="button" 
                onClick={handleReturnToProfile}
                style={{ marginTop: "10px", width: "100%" }}
              >
                Volver al perfil
              </button>
            </div>
          )}
          
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!success && (
            <>
              <button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" onClick={handleCancel} disabled={loading}>
                Cancelar
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditarPerfilPage;