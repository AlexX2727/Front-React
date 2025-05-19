import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api/axios";
import "./MisProyectos.css"; 
import "./ProyectoCardStyles.css"; 
import AddMemberModal from "../components/AddMemberModal";
import EditProjectModal from "../components/EditProjectModal";
import { toast } from "react-toastify"; 

// Componente de confirmación para eliminar
interface DeleteConfirmModalProps {
  projectId: number;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  projectName, 
  onClose, 
  onConfirm 
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Eliminar Proyecto</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <div className="warning-icon">⚠️</div>
          <p className="confirm-message">
            ¿Estás seguro de que deseas eliminar el proyecto <strong>"{projectName}"</strong>?
          </p>
          <p className="warning-text">Esta acción no se puede deshacer y se eliminarán todas las tareas asociadas.</p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-delete" onClick={onConfirm}>Eliminar Proyecto</button>
        </div>
      </div>
    </div>
  );
};

interface Proyecto {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  _count: {
    members: number;
    tasks: number;
  };
}

function MisProyectosPage() {
  // Estados
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  
  // Usar ref para evitar bucles
  const isDataFetched = useRef(false);
  
  const navigate = useNavigate();

  // Obtener usuario del localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Cargar proyectos una sola vez
  useEffect(() => {
    // Si ya hemos cargado los datos, no hacemos nada
    if (isDataFetched.current) return;
    
    const fetchProyectos = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/projects/owner/${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProyectos(res.data);
        isDataFetched.current = true;
      } catch (error) {
        console.error("Error cargando proyectos:", error);
        toast.error("Error al cargar los proyectos");
      } finally {
        setLoading(false);
      }
    };

    fetchProyectos();
  }, [user]); // Solo depende de user

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!user && !loading) {
      toast.error("Debes iniciar sesión para ver tus proyectos");
      navigate("/");
    }
  }, [loading, navigate, user]);

  // Manejadores de eventos
  const handleCreateProject = () => {
    navigate("/crear-proyecto");
  };

  const handleEditClick = (id: number) => {
    setSelectedProjectId(id);
    setShowEditProjectModal(true);
  };

  const handleAddMembersClick = (id: number) => {
    setSelectedProjectId(id);
    setShowAddMemberModal(true);
  };
  
  const handleDeleteClick = (id: number, name: string) => {
    setSelectedProjectId(id);
    setSelectedProjectName(name);
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedProjectId) return;
    
    try {
      await api.delete(`/projects/${selectedProjectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      toast.success("Proyecto eliminado con éxito");
      // Actualizar la lista de proyectos sin hacer una nueva petición
      setProyectos(prevProyectos => 
        prevProyectos.filter(proyecto => proyecto.id !== selectedProjectId)
      );
      setShowDeleteModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error eliminando proyecto:", error);
      const errorMessage = error.response?.data?.message || "Error al eliminar el proyecto";
      toast.error(errorMessage);
    }
  };
  
  // Manejar cierre de modales
  const handleCloseAddMemberModal = () => {
    setShowAddMemberModal(false);
    setSelectedProjectId(null);
  };
  
  const handleCloseEditModal = () => {
    setShowEditProjectModal(false);
    setSelectedProjectId(null);
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProjectId(null);
    setSelectedProjectName("");
  };

  // Actualizar datos después de editar o añadir miembros
  const handleDataUpdated = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      const res = await api.get(`/projects/owner/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProyectos(res.data);
    } catch (error) {
      console.error("Error actualizando proyectos:", error);
      toast.error("Error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "completado":
        return "var(--status-completed, #10b981)";
      case "in progress":
      case "en progreso":
      case "active":
        return "var(--status-progress, #3b82f6)";
      case "pending":
      case "pendiente":
      case "on hold":
        return "var(--status-pending, #f59e0b)";
      default:
        return "var(--status-default, #6b7280)";
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="proyectos-simple-container">
        <div className="loading-container-simple">
          <div className="loader-simple"></div>
          <p>Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="proyectos-simple-container">
      <div className="proyectos-layout-center">
        <h1 className="main-title-gradient">Mis Proyectos</h1>
        <p className="proyectos-simple-subtitle">
          Gestiona tus proyectos y colabora con tu equipo
        </p>
        <button className="btn-primary-gradient" onClick={handleCreateProject}>
          <span>+</span> Crear nuevo proyecto
        </button>

        {proyectos.length === 0 ? (
          <div className="no-proyectos-simple">
            <div className="empty-state-icon-simple">📂</div>
            <h3>No tienes proyectos aún</h3>
            <p>Crea tu primer proyecto para empezar a gestionar tus tareas</p>
            <button className="btn-primary-gradient" onClick={handleCreateProject}>
              Crear proyecto
            </button>
          </div>
        ) : (
          <div className="proyectos-grid-v2">
            {proyectos.map((proyecto) => (
              <div key={proyecto.id} className="proyecto-card-v2">
                <h3 className="proyecto-title-v2">{proyecto.name}</h3>
                <p className="proyecto-description-v2">{proyecto.description}</p>
                
                <div 
                  className="proyecto-status-v2"
                  style={{ backgroundColor: getStatusColor(proyecto.status) }}
                >
                  {proyecto.status}
                </div>
                
                <div className="proyecto-stats-v2">
                  <div className="stat-item-v2">
                    <span className="stat-icon-v2">👥</span>
                    <span className="stat-value-v2">{proyecto._count.members}</span>
                    <span className="stat-label-v2">Miembros</span>
                  </div>
                  <div className="stat-item-v2">
                    <span className="stat-icon-v2">✓</span>
                    <span className="stat-value-v2">{proyecto._count.tasks}</span>
                    <span className="stat-label-v2">Tareas</span>
                  </div>
                </div>
                
                <div className="proyecto-dates-v2">
                  {proyecto.startDate && (
                    <div className="date-item">
                      <span className="date-label">Inicio:</span>
                      <span className="date-value">{formatDate(proyecto.startDate)}</span>
                    </div>
                  )}
                  {proyecto.endDate && (
                    <div className="date-item">
                      <span className="date-label">Fin:</span>
                      <span className="date-value">{formatDate(proyecto.endDate)}</span>
                    </div>
                  )}
                </div>
                
                <div className="proyecto-actions-v2">
                  <button 
                    className="btn-action-v2 btn-edit-v2"
                    onClick={() => handleEditClick(proyecto.id)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-action-v2 btn-members-v2"
                    onClick={() => handleAddMembersClick(proyecto.id)}
                  >
                    Miembros
                  </button>
                  <button 
                    className="btn-action-v2 btn-delete-v2"
                    onClick={() => handleDeleteClick(proyecto.id, proyecto.name)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {showAddMemberModal && selectedProjectId && (
        <AddMemberModal
          projectId={selectedProjectId}
          onClose={handleCloseAddMemberModal}
          onSuccess={handleDataUpdated}
        />
      )}

      {showEditProjectModal && selectedProjectId && (
        <EditProjectModal
          projectId={selectedProjectId}
          onClose={handleCloseEditModal}
          onSuccess={handleDataUpdated}
        />
      )}
      
      {showDeleteModal && selectedProjectId && (
        <DeleteConfirmModal
          projectId={selectedProjectId}
          projectName={selectedProjectName}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default MisProyectosPage;