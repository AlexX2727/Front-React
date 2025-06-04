// TaskListModal.tsx - CON FUNCIONALIDAD DE TASK DETAIL MODAL
import React, { useState, useEffect } from 'react';
import './TaskListModal.css';
import TaskDetailModal from './TaskDetailModal'; // Importar el modal de detalles
import { 
  getProjectsByOwner, 
  Project,
  Task as TaskType,
  User,
  getTasksWithFilters,
  getTaskProjectMembers 
} from '../api/services';

// Extend the Task interface to include project and assignee details
interface Task extends Omit<TaskType, 'assignee' | 'project'> {
  project?: {
    id: number;
    name: string;
  };
  assignee?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
  };
}

interface TaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

const TaskListModal: React.FC<TaskListModalProps> = ({
  isOpen,
  onClose,
  // theme = 'dark' // Unused prop
}) => {
  // Estados básicos
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para TaskDetailModal
  const [showTaskDetail, setShowTaskDetail] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskProjectMembers, setTaskProjectMembers] = useState<User[]>([]);

  console.log('TaskListModal render:', { isOpen, user: user?.id });

  // Cargar proyectos cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    
    const fetchProjects = async () => {
      try {
        const data = await getProjectsByOwner(user.id);
        setProjects(data);
      } catch (err) {
        console.error('Error al cargar proyectos:', err);
        setError('Error al cargar los proyectos. Por favor, intente de nuevo.');
      }
    };

    fetchProjects();
  }, [isOpen, user?.id]);

  // Cargar tareas cuando cambian los filtros
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        setError(null);
        
        const filterOptions: any = {
          userId: user.id,
          myTasks: true
        };
        
        if (selectedProject) filterOptions.projectId = selectedProject;
        
        const tasksData = await getTasksWithFilters(filterOptions);
        setTasks(tasksData);
      } catch (err) {
        console.error('Error al cargar tareas:', err);
        setError('Error al cargar las tareas. Por favor, intente de nuevo.');
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [isOpen, user?.id, selectedProject]);

  // Filtrar tareas por búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTasks(tasks);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = tasks.filter(task => {
      return (
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.project?.name?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredTasks(filtered);
  }, [tasks, searchTerm]);

  // Función para abrir el modal de detalles de tarea
  const handleTaskClick = async (taskId: number) => {
    try {
      setSelectedTaskId(taskId);
      
      // Buscar la tarea para obtener el project_id
      const task = tasks.find(t => t.id === taskId);
      if (task?.project_id) {
        // Cargar miembros del proyecto
        try {
          const members = await getTaskProjectMembers(task.project_id);
          setTaskProjectMembers(members);
        } catch (err) {
          console.error('Error al cargar miembros del proyecto:', err);
          setTaskProjectMembers([]);
        }
      }
      
      setShowTaskDetail(true);
    } catch (error) {
      console.error('Error al abrir detalles de tarea:', error);
    }
  };

  // Función para cerrar el modal de detalles
  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTaskId(null);
    setTaskProjectMembers([]);
  };

  // Función para refrescar tareas después de editar
  const handleTaskEditSuccess = () => {
    // Recargar las tareas para mostrar los cambios
    if (user?.id) {
      const fetchTasks = async () => {
        try {
          const filterOptions: any = {
            userId: user.id,
            myTasks: true
          };
          
          if (selectedProject) filterOptions.projectId = selectedProject;
          
          const tasksData = await getTasksWithFilters(filterOptions);
          setTasks(tasksData);
        } catch (err) {
          console.error('Error al recargar tareas:', err);
        }
      };

      fetchTasks();
    }
  };

  // Funciones auxiliares
  const formatearFecha = (fechaStr?: string): string => {
    if (!fechaStr) return 'No definida';
    
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getEstadoTexto = (estado?: string): string => {
    switch (estado) {
      case 'Todo': return 'Por Hacer';
      case 'In Progress': return 'En Progreso';
      case 'Review': return 'En Revisión';
      case 'Done': return 'Completado';
      case 'Blocked': return 'Bloqueado';
      default: return estado || 'Desconocido';
    }
  };

  const getPrioridadTexto = (prioridad?: string): string => {
    switch (prioridad) {
      case 'Low': return 'Baja';
      case 'Medium': return 'Media';
      case 'High': return 'Alta';
      case 'Critical': return 'Crítica';
      default: return 'No definida';
    }
  };

  const getPrioridadColor = (prioridad?: string): string => {
    switch (prioridad) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#f97316';
      case 'Critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoColor = (estado?: string): string => {
    switch (estado) {
      case 'Todo': return '#6b7280';
      case 'In Progress': return '#3b82f6';
      case 'Review': return '#f59e0b';
      case 'Done': return '#10b981';
      case 'Blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Si no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div style={modalOverlayStyles} onClick={onClose}>
        <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={headerStyles}>
            <div style={titleStyles}>
              <span style={{ marginRight: '12px' }}>📋</span>
              <span>Gestión de Tareas</span>
            </div>
            <button 
              onClick={onClose}
              style={closeButtonStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={bodyStyles}>
            {/* Filtros */}
            <div style={filtersStyles}>
              <div style={filterRowStyles}>
                <input
                  type="text"
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={inputStyles}
                />
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyles}
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={errorStyles}>
                {error}
              </div>
            )}

            {/* Loading */}
            {loadingTasks && (
              <div style={loadingStyles}>
                <div style={spinnerStyles}></div>
                <p>Cargando tareas...</p>
              </div>
            )}

            {/* Lista de tareas */}
            {!loadingTasks && filteredTasks.length > 0 ? (
              <div style={tasksGridStyles}>
                {filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    style={taskCardStyles}
                    onClick={() => handleTaskClick(task.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                    }}
                  >
                    <div style={taskHeaderStyles}>
                      <h6 style={taskTitleStyles}>{task.title}</h6>
                      <span 
                        style={{
                          ...priorityBadgeStyles,
                          backgroundColor: getPrioridadColor(task.priority),
                        }}
                      >
                        {getPrioridadTexto(task.priority)}
                      </span>
                    </div>
                    
                    <p style={taskDescStyles}>
                      {task.description || 'Sin descripción'}
                    </p>
                    
                    <div style={taskMetaStyles}>
                      <span style={{
                        ...statusBadgeStyles,
                        backgroundColor: getEstadoColor(task.status)
                      }}>
                        {getEstadoTexto(task.status)}
                      </span>
                      <span style={projectBadgeStyles}>
                        📁 {task.project?.name || 'Sin proyecto'}
                      </span>
                    </div>
                    
                    {task.dueDate && (
                      <div style={dueDateStyles}>
                        📅 {formatearFecha(task.dueDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : !loadingTasks ? (
              <div style={emptyStateStyles}>
                <p>No se encontraron tareas que coincidan con los filtros</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div style={footerStyles}>
            <button 
              onClick={onClose} 
              style={closeButtonBottomStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalles de tarea */}
      <TaskDetailModal
        isOpen={showTaskDetail}
        onClose={handleCloseTaskDetail}
        taskId={selectedTaskId}
        onEditSuccess={handleTaskEditSuccess}
        projectMembers={taskProjectMembers}
      />
    </>
  );
};

// Estilos inline (actualizados con efectos hover mejorados)
const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '16px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
  maxWidth: '1200px',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)'
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#f8fafc',
  display: 'flex',
  alignItems: 'center'
};

const closeButtonStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  transition: 'all 0.2s'
};

const bodyStyles: React.CSSProperties = {
  flex: 1,
  padding: '24px',
  overflow: 'auto',
  backgroundColor: '#0f172a'
};

const filtersStyles: React.CSSProperties = {
  marginBottom: '24px',
  padding: '20px',
  backgroundColor: 'rgba(30, 41, 59, 0.7)',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.2)'
};

const filterRowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px'
};

const inputStyles: React.CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  padding: '12px 16px',
  color: '#f8fafc',
  fontSize: '14px'
};

const selectStyles: React.CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  padding: '12px 16px',
  color: '#f8fafc',
  fontSize: '14px'
};

const errorStyles: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: '#ef4444',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '16px'
};

const loadingStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px',
  gap: '16px'
};

const spinnerStyles: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid rgba(59, 130, 246, 0.3)',
  borderTop: '3px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const tasksGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '16px'
};

const taskCardStyles: React.CSSProperties = {
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  borderRadius: '12px',
  padding: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative' as 'relative'
};

const taskHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px'
};

const taskTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 600,
  color: '#f8fafc',
  flex: 1,
  marginRight: '12px'
};

const priorityBadgeStyles: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'white'
};

const taskDescStyles: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '14px',
  color: '#94a3b8',
  lineHeight: 1.5
};

const taskMetaStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '8px'
};

const statusBadgeStyles: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'white'
};

const projectBadgeStyles: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: '#3b82f6',
  color: 'white'
};

const dueDateStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8'
};

const emptyStateStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px',
  color: '#94a3b8'
};

const footerStyles: React.CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  display: 'flex',
  justifyContent: 'flex-end'
};

const closeButtonBottomStyles: React.CSSProperties = {
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s'
};

export default TaskListModal;