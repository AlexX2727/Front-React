import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api/axios";
import "./MisProyectos.css"; 
import AddMemberModal from "../components/AddMemberModal";

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
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const fetchProyectos = async () => {
    try {
      const res = await api.get(`/projects/owner/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProyectos(res.data);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProyectos();
    }
  }, [user]);

  const handleCreateProject = () => {
    navigate("/crear-proyecto");
  };

  const handleEditClick = (id: number) => {
    console.log(`Editar proyecto con ID: ${id}`);
    // Aquí puedes implementar la lógica para editar el proyecto
  };

  const handleAddMembersClick = (id: number) => {
    setSelectedProjectId(id);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProjectId(null);
  };

  const handleMemberAdded = () => {
    // Refrescar los datos del proyecto después de añadir un miembro
    fetchProyectos();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Determinar color según el estado del proyecto
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completado":
        return "var(--status-completed)";
      case "en progreso":
      case "active":
        return "var(--status-progress)";
      case "pendiente":
        return "var(--status-pending)";
      default:
        return "var(--status-default)";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="proyectos-container">
      <header className="proyectos-header">
        <h1 className="proyectos-title">Mis Proyectos</h1>
        <button className="btn-crear-proyecto" onClick={handleCreateProject}>
          <span className="btn-icon">+</span> Crear nuevo proyecto
        </button>
      </header>

      {proyectos.length === 0 ? (
        <div className="no-proyectos">
          <div className="empty-state-icon">📂</div>
          <h3>No tienes proyectos aún</h3>
          <p>Crea tu primer proyecto para empezar a gestionar tus tareas</p>
          <button className="btn-crear-proyecto" onClick={handleCreateProject}>Crear proyecto</button>
        </div>
      ) : (
        <div className="proyectos-grid">
          {proyectos.map((proyecto, index) => (
            <div 
              key={proyecto.id} 
              className={`proyecto-card ${hoverIndex === index ? 'hover' : ''}`}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div className="proyecto-status-indicator" style={{ backgroundColor: getStatusColor(proyecto.status) }}></div>
              
              <div className="proyecto-header">
                <h3 className="proyecto-title">{proyecto.name}</h3>
              </div>
              
              <div className="proyecto-description">
                <p>{proyecto.description}</p>
              </div>
              
              <div className="proyecto-status">
                <span className="status-badge" style={{ backgroundColor: getStatusColor(proyecto.status) }}>
                  {proyecto.status}
                </span>
              </div>
              
              <div className="proyecto-stats">
                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span className="stat-value">{proyecto._count.members}</span>
                  <span className="stat-label">Miembros</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">✓</span>
                  <span className="stat-value">{proyecto._count.tasks}</span>
                  <span className="stat-label">Tareas</span>
                </div>
              </div>
              
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
              
              <div className="proyecto-actions">
                <button 
                  className="btn-action btn-edit"
                  onClick={() => handleEditClick(proyecto.id)}
                >
                  Editar
                </button>
                <button 
                  className="btn-action btn-members"
                  onClick={() => handleAddMembersClick(proyecto.id)}
                >
                  Añadir miembros
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para añadir miembros */}
      {showModal && selectedProjectId && (
        <AddMemberModal
          projectId={selectedProjectId}
          onClose={handleCloseModal}
          onSuccess={handleMemberAdded}
        />
      )}
    </div>
  );
}

export default MisProyectosPage;