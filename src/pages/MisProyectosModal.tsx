import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import "./MisProyectosModal.css"; 
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
    <>
      <div className="delete-confirm-backdrop" onClick={onClose} />
      <div className="delete-confirm-modal">
        <div className="delete-confirm-content">
          <div className="delete-confirm-header">
            <h3>Eliminar Proyecto</h3>
            <button className="delete-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="delete-confirm-body">
            <div className="warning-icon">⚠️</div>
            <p className="confirm-message">
              ¿Estás seguro de que deseas eliminar el proyecto <strong>"{projectName}"</strong>?
            </p>
            <p className="warning-text">Esta acción no se puede deshacer y se eliminarán todas las tareas asociadas.</p>
          </div>
          <div className="delete-confirm-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-danger" onClick={onConfirm}>Eliminar Proyecto</button>
          </div>
        </div>
      </div>
    </>
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

interface MisProyectosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProjectClick?: () => void;
}

const MisProyectosModal: React.FC<MisProyectosModalProps> = ({
  isOpen,
  onClose,
  onCreateProjectClick
}) => {
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

  // Obtener usuario del localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Cargar proyectos cuando se abre el modal
  useEffect(() => {
    if (!isOpen) {
      // Resetear cuando se cierra
      isDataFetched.current = false;
      return;
    }
    
    // Si ya hemos cargado los datos para esta sesión, no hacemos nada
    if (isDataFetched.current) return;
    
    const fetchProyectos = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
  }, [isOpen, user]);

  // Manejadores de eventos
  const handleCreateProject = () => {
    if (onCreateProjectClick) {
      onCreateProjectClick(); // Callback externo para manejar la creación
    }
    onClose(); // Cerrar el modal
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
      setSelectedProjectId(null);
      setSelectedProjectName("");
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
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "completado":
        return "#10b981";
      case "in progress":
      case "en progreso":
      case "active":
        return "#3b82f6";
      case "pending":
      case "pendiente":
      case "on hold":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Completado";
      case "in progress":
        return "En Progreso";
      case "active":
        return "Activo";
      case "pending":
        return "Pendiente";
      case "on hold":
        return "En Pausa";
      default:
        return status;
    }
  };

  // Si no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }

  // Renderizado principal
  return (
    <>
      {/* Backdrop */}
      <div className="proyectos-modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="proyectos-modal dark-theme">
        <div className="proyectos-modal-dialog">
          <div className="proyectos-modal-content">
            {/* Header */}
            <div className="proyectos-modal-header">
              <h2 className="proyectos-modal-title">
                <span className="title-icon">📁</span>
                Mis Proyectos
              </h2>
              <div className="modal-header-actions">
                <button className="btn btn-primary" onClick={handleCreateProject}>
                  <span>+</span> Crear nuevo proyecto
                </button>
                <button className="proyectos-modal-close" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="proyectos-modal-body">
              {loading ? (
                <div className="loading-container">
                  <div className="spinner-border"></div>
                  <p>Cargando proyectos...</p>
                </div>
              ) : proyectos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📂</div>
                  <h3>No tienes proyectos aún</h3>
                  <p>Crea tu primer proyecto para empezar a gestionar tus tareas</p>
                  <button className="btn btn-primary" onClick={handleCreateProject}>
                    Crear proyecto
                  </button>
                </div>
              ) : (
                <div className="proyectos-grid">
                  {proyectos.map((proyecto) => (
                    <div key={proyecto.id} className="proyecto-card">
                      <div className="proyecto-card-header">
                        <h3 className="proyecto-title">{proyecto.name}</h3>
                        <span 
                          className="proyecto-status"
                          style={{ backgroundColor: getStatusColor(proyecto.status) }}
                        >
                          {getStatusText(proyecto.status)}
                        </span>
                      </div>
                      
                      <p className="proyecto-description">{proyecto.description}</p>
                      
                      <div className="proyecto-stats">
                        <div className="stat-item">
                          <span className="stat-icon">👥</span>
                          <div className="stat-content">
                            <span className="stat-value">{proyecto._count.members}</span>
                            <span className="stat-label">Miembros</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">✓</span>
                          <div className="stat-content">
                            <span className="stat-value">{proyecto._count.tasks}</span>
                            <span className="stat-label">Tareas</span>
                          </div>
                        </div>
                      </div>
                      
                      {(proyecto.startDate || proyecto.endDate) && (
                        <div className="proyecto-dates">
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
                      )}
                      
                      <div className="proyecto-actions">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditClick(proyecto.id)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleAddMembersClick(proyecto.id)}
                        >
                          👥 Miembros
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteClick(proyecto.id, proyecto.name)}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales anidados */}
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
    </>
  );
};

export default MisProyectosModal;